/**
 * MCSELLER 토스페이 결제 시스템
 * 프로덕션 레벨 결제 처리
 */

// 토스페이 클라이언트 키 (실제 운영시 서버에서 받아와야 함)
const TOSS_CLIENT_KEY = window.TOSS_CLIENT_KEY || '';

// 토스페이 초기화
let tossPayments = null;

async function initializeTossPayments() {
    if (!TOSS_CLIENT_KEY) {
        console.error('토스페이 클라이언트 키가 설정되지 않았습니다.');
        return;
    }
    
    try {
        tossPayments = TossPayments(TOSS_CLIENT_KEY);
        console.log('✅ 토스페이 초기화 완료');
    } catch (error) {
        console.error('토스페이 초기화 실패:', error);
    }
}

// 결제 요청
async function requestPayment(orderData) {
    if (!tossPayments) {
        alert('결제 시스템이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
        return;
    }
    
    if (!window.supabaseClient) {
        alert('인증 시스템이 준비되지 않았습니다.');
        return;
    }
    
    try {
        // 사용자 확인
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) {
            alert('로그인이 필요합니다.');
            window.location.href = '/auth.html';
            return;
        }
        
        // 주문 생성
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // DB에 주문 저장
        const { data: order, error: orderError } = await window.supabaseClient
            .from('orders')
            .insert({
                user_id: user.id,
                product_id: orderData.productId,
                amount: orderData.amount,
                payment_method: 'card',
                payment_status: 'pending',
                order_id: orderId
            })
            .select()
            .single();
        
        if (orderError) {
            console.error('주문 생성 오류:', orderError);
            alert('주문 생성에 실패했습니다.');
            return;
        }
        
        // 토스페이 결제 요청
        await tossPayments.requestPayment('카드', {
            amount: orderData.amount,
            orderId: orderId,
            orderName: orderData.productName,
            customerName: orderData.customerName || user.email,
            successUrl: `${window.location.origin}/payment-success.html`,
            failUrl: `${window.location.origin}/payment-fail.html`,
        });
        
    } catch (error) {
        console.error('결제 요청 오류:', error);
        alert('결제 요청 중 오류가 발생했습니다.');
    }
}

// 결제 성공 처리
async function handlePaymentSuccess(paymentKey, orderId, amount) {
    try {
        // 서버에 결제 승인 요청
        const response = await fetch('/api/payment/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentKey,
                orderId,
                amount
            }),
        });
        
        if (!response.ok) {
            throw new Error('결제 승인 실패');
        }
        
        const result = await response.json();
        
        // 주문 상태 업데이트
        const { error: updateError } = await window.supabaseClient
            .from('orders')
            .update({
                payment_status: 'completed',
                payment_key: paymentKey,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
        
        if (updateError) {
            console.error('주문 상태 업데이트 오류:', updateError);
        }
        
        // 콘텐츠 접근 권한 부여
        const { data: order } = await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('order_id', orderId)
            .single();
        
        if (order) {
            await window.contentAccess.grantContentAccess(order.id);
        }
        
        return result;
    } catch (error) {
        console.error('결제 확인 오류:', error);
        throw error;
    }
}

// 결제 실패 처리
async function handlePaymentFailure(orderId, errorCode, errorMessage) {
    try {
        // 주문 상태 업데이트
        const { error: updateError } = await window.supabaseClient
            .from('orders')
            .update({
                payment_status: 'failed',
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);
        
        if (updateError) {
            console.error('주문 상태 업데이트 오류:', updateError);
        }
        
        console.error('결제 실패:', errorCode, errorMessage);
    } catch (error) {
        console.error('결제 실패 처리 오류:', error);
    }
}

// 카카오페이 결제 (토스페이먼츠 통합)
async function requestKakaoPay(orderData) {
    if (!tossPayments) {
        alert('결제 시스템이 준비되지 않았습니다.');
        return;
    }
    
    try {
        // 토스페이먼츠는 카카오페이도 지원
        await tossPayments.requestPayment('카카오페이', {
            amount: orderData.amount,
            orderId: orderData.orderId,
            orderName: orderData.productName,
            customerName: orderData.customerName,
            successUrl: `${window.location.origin}/payment-success.html`,
            failUrl: `${window.location.origin}/payment-fail.html`,
        });
    } catch (error) {
        console.error('카카오페이 결제 오류:', error);
        alert('카카오페이 결제 요청 중 오류가 발생했습니다.');
    }
}

// 초기화
if (typeof TossPayments !== 'undefined') {
    initializeTossPayments();
} else {
    // 토스페이 SDK 로드 대기
    window.addEventListener('load', () => {
        if (typeof TossPayments !== 'undefined') {
            initializeTossPayments();
        }
    });
}

// Export
window.payment = {
    requestPayment,
    handlePaymentSuccess,
    handlePaymentFailure,
    requestKakaoPay
};