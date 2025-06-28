// TossPay 결제 처리 JavaScript
let tossPayments;
let currentPaymentData = null;

// TossPay 초기화
function initializeTossPayments() {
    const clientKey = window.location.hostname === 'localhost' 
        ? 'test_ck_your_test_client_key' 
        : process.env.TOSS_CLIENT_KEY || 'live_ck_your_live_client_key';
    
    try {
        if (typeof TossPayments !== 'undefined') {
            tossPayments = TossPayments(clientKey);
            console.log('TossPay가 초기화되었습니다.');
        } else {
            console.error('TossPay SDK가 로드되지 않았습니다.');
        }
    } catch (error) {
        console.error('TossPay 초기화 오류:', error);
    }
}

// 적립금과 할인코드를 적용한 최종 결제 금액 계산
function calculateFinalAmount(originalPrice, userPoints = 0, discountCode = null) {
    let finalAmount = originalPrice;
    let pointsUsed = 0;
    let discountAmount = 0;
    let discountInfo = null;

    // 할인코드 적용
    if (discountCode) {
        const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        const validCode = discountCodes.find(code => 
            code.code === discountCode.toUpperCase() && 
            code.isActive && 
            (code.usedCount || 0) < code.maxUses
        );

        if (validCode) {
            if (validCode.type === 'percent') {
                discountAmount = Math.floor(finalAmount * (validCode.value / 100));
            } else if (validCode.type === 'amount') {
                discountAmount = Math.min(validCode.value, finalAmount);
            }
            finalAmount -= discountAmount;
            discountInfo = validCode;
        }
    }

    // 적립금 사용 (할인 후 금액에서 차감)
    if (userPoints > 0 && finalAmount > 0) {
        pointsUsed = Math.min(userPoints, finalAmount);
        finalAmount -= pointsUsed;
    }

    return {
        originalPrice,
        finalAmount: Math.max(finalAmount, 0),
        pointsUsed,
        discountAmount,
        discountInfo
    };
}

// 사용자 적립금 조회
function getUserPoints(userId) {
    try {
        const userPoints = JSON.parse(localStorage.getItem(`user_points_${userId}`) || '0');
        return parseInt(userPoints);
    } catch (error) {
        console.error('적립금 조회 오류:', error);
        return 0;
    }
}

// 사용자 적립금 업데이트
function updateUserPoints(userId, newPoints) {
    try {
        localStorage.setItem(`user_points_${userId}`, newPoints.toString());
        return true;
    } catch (error) {
        console.error('적립금 업데이트 오류:', error);
        return false;
    }
}

// 할인코드 사용 횟수 업데이트
function updateDiscountCodeUsage(discountCode) {
    try {
        const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        const codeIndex = discountCodes.findIndex(code => code.code === discountCode.toUpperCase());
        
        if (codeIndex !== -1) {
            discountCodes[codeIndex].usedCount = (discountCodes[codeIndex].usedCount || 0) + 1;
            localStorage.setItem('discountCodes', JSON.stringify(discountCodes));
            return true;
        }
        return false;
    } catch (error) {
        console.error('할인코드 사용 횟수 업데이트 오류:', error);
        return false;
    }
}

// 신규 회원 적립금 지급
function grantNewUserPoints(userId) {
    try {
        const newUserPoints = parseInt(localStorage.getItem('newUserPoints') || '31500');
        const existingPoints = getUserPoints(userId);
        
        // 이미 적립금을 받았는지 확인
        const hasReceivedWelcomePoints = localStorage.getItem(`welcome_points_${userId}`);
        if (!hasReceivedWelcomePoints) {
            updateUserPoints(userId, existingPoints + newUserPoints);
            localStorage.setItem(`welcome_points_${userId}`, 'true');
            return newUserPoints;
        }
        return 0;
    } catch (error) {
        console.error('신규 회원 적립금 지급 오류:', error);
        return 0;
    }
}

// 결제 요청 데이터 생성 (적립금/할인코드 적용)
function createPaymentRequest(product, user, paymentOptions = {}) {
    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const { paymentMethod = 'card', pointsToUse = 0, discountCode = null } = paymentOptions;
    
    // 최종 결제 금액 계산
    const calculation = calculateFinalAmount(product.price, pointsToUse, discountCode);
    
    return {
        amount: calculation.finalAmount,
        originalAmount: calculation.originalPrice,
        pointsUsed: calculation.pointsUsed,
        discountAmount: calculation.discountAmount,
        discountCode: discountCode,
        discountInfo: calculation.discountInfo,
        orderId: orderId,
        orderName: product.title.length > 100 ? product.title.substring(0, 97) + '...' : product.title,
        customerName: user.user_metadata?.name || user.email.split('@')[0],
        customerEmail: user.email,
        successUrl: `${window.location.origin}/payment-success.html?orderId=${orderId}&productId=${product.id}`,
        failUrl: `${window.location.origin}/payment-fail.html?orderId=${orderId}&productId=${product.id}`,
        paymentMethod: paymentMethod,
        productId: product.id,
        userId: user.id
    };
}

// 카드 결제 처리
async function processCardPayment(paymentData) {
    try {
        if (!tossPayments) {
            throw new Error('TossPay가 초기화되지 않았습니다.');
        }
        
        // 주문 정보를 서버에 저장 (결제 전)
        await saveOrderToDatabase(paymentData, 'pending');
        
        // TossPay 카드 결제 요청
        await tossPayments.requestPayment('카드', {
            amount: paymentData.amount,
            orderId: paymentData.orderId,
            orderName: paymentData.orderName,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            successUrl: paymentData.successUrl,
            failUrl: paymentData.failUrl
        });
        
    } catch (error) {
        console.error('카드 결제 요청 오류:', error);
        handlePaymentError(error);
    }
}

// 계좌이체 결제 처리
async function processBankTransferPayment(paymentData) {
    try {
        if (!tossPayments) {
            throw new Error('TossPay가 초기화되지 않았습니다.');
        }
        
        await saveOrderToDatabase(paymentData, 'pending');
        
        await tossPayments.requestPayment('계좌이체', {
            amount: paymentData.amount,
            orderId: paymentData.orderId,
            orderName: paymentData.orderName,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            successUrl: paymentData.successUrl,
            failUrl: paymentData.failUrl
        });
        
    } catch (error) {
        console.error('계좌이체 결제 요청 오류:', error);
        handlePaymentError(error);
    }
}

// 휴대폰 결제 처리
async function processPhonePayment(paymentData) {
    try {
        if (!tossPayments) {
            throw new Error('TossPay가 초기화되지 않았습니다.');
        }
        
        await saveOrderToDatabase(paymentData, 'pending');
        
        await tossPayments.requestPayment('휴대폰', {
            amount: paymentData.amount,
            orderId: paymentData.orderId,
            orderName: paymentData.orderName,
            customerName: paymentData.customerName,
            customerEmail: paymentData.customerEmail,
            successUrl: paymentData.successUrl,
            failUrl: paymentData.failUrl
        });
        
    } catch (error) {
        console.error('휴대폰 결제 요청 오류:', error);
        handlePaymentError(error);
    }
}

// 주문 정보 데이터베이스 저장
async function saveOrderToDatabase(paymentData, status = 'pending') {
    try {
        const orderData = {
            id: paymentData.orderId,
            user_id: paymentData.userId,
            product_id: paymentData.productId,
            total_amount: paymentData.amount,
            status: status,
            payment_method: paymentData.paymentMethod,
            customer_name: paymentData.customerName,
            customer_email: paymentData.customerEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('orders')
            .insert([orderData])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log('주문 정보가 저장되었습니다:', data);
        return data;
        
    } catch (error) {
        console.error('주문 저장 오류:', error);
        throw error;
    }
}

// 결제 성공 처리
async function handlePaymentSuccess(paymentKey, orderId, amount) {
    try {
        showToast('결제 승인을 진행합니다...', 'info');
        
        // 결제 승인 요청
        const approvalResult = await approvePayment(paymentKey, orderId, amount);
        
        if (approvalResult.success) {
            // 주문 상태 업데이트
            await updateOrderStatus(orderId, 'completed', approvalResult.data);
            
            // 상품 접근 권한 부여
            await grantProductAccess(orderId);
            
            // 적립금 및 할인코드 사용 처리
            await processPaymentRewards(currentPaymentData);
            
            showToast('결제가 완료되었습니다!', 'success');
            
            // 성공 페이지로 리다이렉트
            window.location.href = `/payment-success.html?orderId=${orderId}`;
            
        } else {
            throw new Error(approvalResult.message || '결제 승인에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('결제 성공 처리 오류:', error);
        await updateOrderStatus(orderId, 'failed');
        showToast('결제 처리 중 오류가 발생했습니다.', 'error');
    }
}

// 결제 승인 요청
async function approvePayment(paymentKey, orderId, amount) {
    try {
        // 실제 구현에서는 서버사이드에서 TossPay API 호출
        // 보안상 클라이언트에서 직접 승인하지 않고 서버를 통해 처리
        
        const response = await fetch('/api/payments/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentKey: paymentKey,
                orderId: orderId,
                amount: amount
            })
        });
        
        if (!response.ok) {
            throw new Error('결제 승인 요청 실패');
        }
        
        const result = await response.json();
        return { success: true, data: result };
        
    } catch (error) {
        console.error('결제 승인 오류:', error);
        
        // 서버 API가 없는 경우 임시로 성공 처리 (개발용)
        if (window.location.hostname === 'localhost') {
            console.warn('개발 환경: 결제 승인을 시뮬레이션합니다.');
            return {
                success: true,
                data: {
                    paymentKey: paymentKey,
                    orderId: orderId,
                    amount: amount,
                    approvedAt: new Date().toISOString()
                }
            };
        }
        
        return { success: false, message: error.message };
    }
}

// 주문 상태 업데이트
async function updateOrderStatus(orderId, status, paymentData = null) {
    try {
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };
        
        if (paymentData) {
            updateData.payment_key = paymentData.paymentKey;
            updateData.approved_at = paymentData.approvedAt || new Date().toISOString();
        }
        
        const { error } = await supabaseClient
            .from('orders')
            .update(updateData)
            .eq('id', orderId);
        
        if (error) {
            throw error;
        }
        
        console.log(`주문 ${orderId} 상태가 ${status}로 업데이트되었습니다.`);
        
    } catch (error) {
        console.error('주문 상태 업데이트 오류:', error);
        throw error;
    }
}

// 상품 접근 권한 부여
async function grantProductAccess(orderId) {
    try {
        // 주문 정보 조회
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('user_id, product_id')
            .eq('id', orderId)
            .single();
        
        if (orderError) {
            throw orderError;
        }
        
        // 접근 권한 부여
        const { error: accessError } = await supabaseClient
            .from('access_rights')
            .insert([{
                user_id: order.user_id,
                product_id: order.product_id,
                granted_at: new Date().toISOString()
            }]);
        
        if (accessError) {
            // 이미 권한이 있는 경우 무시
            if (!accessError.message.includes('duplicate')) {
                throw accessError;
            }
        }
        
        console.log('상품 접근 권한이 부여되었습니다.');
        
    } catch (error) {
        console.error('접근 권한 부여 오류:', error);
        throw error;
    }
}

// 결제 실패 처리
async function handlePaymentFailure(orderId, errorCode, errorMessage) {
    try {
        await updateOrderStatus(orderId, 'failed');
        
        console.error('결제 실패:', errorCode, errorMessage);
        showToast('결제가 취소되거나 실패했습니다.', 'error');
        
        // 실패 페이지로 리다이렉트
        window.location.href = `/payment-fail.html?orderId=${orderId}&error=${errorCode}`;
        
    } catch (error) {
        console.error('결제 실패 처리 오류:', error);
    }
}

// 결제 오류 처리
function handlePaymentError(error) {
    let message = '결제 처리 중 오류가 발생했습니다.';
    
    if (error.code) {
        switch (error.code) {
            case 'INVALID_CARD_COMPANY':
                message = '지원하지 않는 카드사입니다.';
                break;
            case 'INVALID_CARD_NUMBER':
                message = '잘못된 카드번호입니다.';
                break;
            case 'INVALID_UNREGISTERED_SUBMALL':
                message = '등록되지 않은 서브몰입니다.';
                break;
            case 'INVALID_API_KEY':
                message = '유효하지 않은 API 키입니다.';
                break;
            case 'REJECT_CARD_COMPANY':
                message = '카드사에서 결제를 거절했습니다.';
                break;
            default:
                message = error.message || message;
        }
    }
    
    showToast(message, 'error');
}

// 결제 취소 요청
async function cancelPayment(paymentKey, cancelReason = '고객 요청') {
    try {
        const response = await fetch('/api/payments/cancel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentKey: paymentKey,
                cancelReason: cancelReason
            })
        });
        
        if (!response.ok) {
            throw new Error('결제 취소 요청 실패');
        }
        
        const result = await response.json();
        return { success: true, data: result };
        
    } catch (error) {
        console.error('결제 취소 오류:', error);
        return { success: false, message: error.message };
    }
}

// 환불 처리
async function processRefund(orderId, amount, reason = '고객 요청') {
    try {
        // 주문 정보 조회
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select('payment_key, total_amount, status')
            .eq('id', orderId)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (order.status !== 'completed') {
            throw new Error('완료된 주문만 환불 가능합니다.');
        }
        
        if (amount > order.total_amount) {
            throw new Error('환불 금액이 주문 금액을 초과합니다.');
        }
        
        // 결제 취소 요청
        const cancelResult = await cancelPayment(order.payment_key, reason);
        
        if (cancelResult.success) {
            // 주문 상태 업데이트
            await updateOrderStatus(orderId, 'refunded');
            
            // 접근 권한 제거
            await revokeProductAccess(orderId);
            
            showToast('환불이 완료되었습니다.', 'success');
            return true;
        } else {
            throw new Error(cancelResult.message);
        }
        
    } catch (error) {
        console.error('환불 처리 오류:', error);
        showToast('환불 처리 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 상품 접근 권한 제거
async function revokeProductAccess(orderId) {
    try {
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .select('user_id, product_id')
            .eq('id', orderId)
            .single();
        
        if (orderError) {
            throw orderError;
        }
        
        const { error: accessError } = await supabaseClient
            .from('access_rights')
            .delete()
            .eq('user_id', order.user_id)
            .eq('product_id', order.product_id);
        
        if (accessError) {
            throw accessError;
        }
        
        console.log('상품 접근 권한이 제거되었습니다.');
        
    } catch (error) {
        console.error('접근 권한 제거 오류:', error);
        throw error;
    }
}

// 결제 내역 조회
async function getPaymentHistory(userId, limit = 10) {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                products (
                    title,
                    type,
                    image_url
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);
        
        if (error) {
            throw error;
        }
        
        return data || [];
        
    } catch (error) {
        console.error('결제 내역 조회 오류:', error);
        return [];
    }
}

// 결제 상태 확인
async function checkPaymentStatus(orderId) {
    try {
        const { data, error } = await supabaseClient
            .from('orders')
            .select('status, payment_key, created_at, updated_at')
            .eq('id', orderId)
            .single();
        
        if (error) {
            throw error;
        }
        
        return data;
        
    } catch (error) {
        console.error('결제 상태 확인 오류:', error);
        return null;
    }
}

// 결제 수단별 처리 함수 매핑
const paymentProcessors = {
    'card': processCardPayment,
    'transfer': processBankTransferPayment,
    'phone': processPhonePayment
};

// 통합 결제 처리 함수
async function processPayment(product, user, paymentMethod = 'card') {
    try {
        // 결제 데이터 생성
        currentPaymentData = createPaymentRequest(product, user, paymentMethod);
        
        // 결제 방법에 따른 처리
        const processor = paymentProcessors[paymentMethod];
        if (!processor) {
            throw new Error('지원하지 않는 결제 방법입니다.');
        }
        
        await processor(currentPaymentData);
        
    } catch (error) {
        console.error('결제 처리 오류:', error);
        handlePaymentError(error);
    }
}

// 결제 완료 후 적립금 및 할인코드 처리
async function processPaymentRewards(paymentData) {
    try {
        if (!paymentData) return;
        
        // 적립금 차감 처리
        if (paymentData.pointsUsed > 0) {
            const currentPoints = getUserPoints(paymentData.userId);
            const newPoints = currentPoints - paymentData.pointsUsed;
            updateUserPoints(paymentData.userId, Math.max(newPoints, 0));
            console.log(`적립금 ${paymentData.pointsUsed}원 사용됨. 잔여: ${newPoints}원`);
        }
        
        // 할인코드 사용 횟수 업데이트
        if (paymentData.discountCode && paymentData.discountInfo) {
            updateDiscountCodeUsage(paymentData.discountCode);
            console.log(`할인코드 ${paymentData.discountCode} 사용됨`);
        }
        
        // 신규 회원 적립금 지급 (첫 구매시)
        const grantedPoints = grantNewUserPoints(paymentData.userId);
        if (grantedPoints > 0) {
            console.log(`신규 회원 적립금 ${grantedPoints}원 지급됨`);
            showToast(`신규 회원 혜택으로 적립금 ${grantedPoints.toLocaleString()}원이 지급되었습니다!`, 'success');
        }
        
    } catch (error) {
        console.error('결제 보상 처리 오류:', error);
    }
}

// 할인코드 유효성 검증
function validateDiscountCode(discountCode) {
    try {
        if (!discountCode) return { valid: false, message: '할인코드를 입력해주세요.' };
        
        const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        const code = discountCodes.find(c => c.code === discountCode.toUpperCase());
        
        if (!code) {
            return { valid: false, message: '존재하지 않는 할인코드입니다.' };
        }
        
        if (!code.isActive) {
            return { valid: false, message: '비활성화된 할인코드입니다.' };
        }
        
        if ((code.usedCount || 0) >= code.maxUses) {
            return { valid: false, message: '사용 한도가 초과된 할인코드입니다.' };
        }
        
        if (code.expiryDate && new Date(code.expiryDate) < new Date()) {
            return { valid: false, message: '만료된 할인코드입니다.' };
        }
        
        return { valid: true, code: code };
        
    } catch (error) {
        console.error('할인코드 검증 오류:', error);
        return { valid: false, message: '할인코드 검증 중 오류가 발생했습니다.' };
    }
}

// 페이지 로드 시 TossPay 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeTossPayments();
});

// 전역 함수 노출
window.calculateFinalAmount = calculateFinalAmount;
window.getUserPoints = getUserPoints;
window.validateDiscountCode = validateDiscountCode;
window.grantNewUserPoints = grantNewUserPoints;

// 전역 함수로 내보내기
window.processPayment = processPayment;
window.handlePaymentSuccess = handlePaymentSuccess;
window.handlePaymentFailure = handlePaymentFailure;
window.processRefund = processRefund;
window.getPaymentHistory = getPaymentHistory;
window.checkPaymentStatus = checkPaymentStatus;
