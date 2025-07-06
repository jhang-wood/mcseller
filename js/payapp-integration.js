// Payapp 결제 시스템 통합 모듈
// MCSELLER 플랫폼용 Payapp 결제 처리 및 관리

class PayappIntegration {
    constructor() {
        this.supabaseClient = null;
        this.init();
    }

    async init() {
        // Supabase 클라이언트 초기화 대기
        if (typeof window.supabaseClient !== 'undefined') {
            this.supabaseClient = window.supabaseClient;
        } else {
            // Supabase 클라이언트가 아직 로드되지 않은 경우 대기
            const maxWait = 5000; // 5초 대기
            const interval = 100;
            let waited = 0;
            
            while (!window.supabaseClient && waited < maxWait) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
            
            this.supabaseClient = window.supabaseClient;
        }
        
        if (!this.supabaseClient) {
            console.error('Supabase 클라이언트를 초기화할 수 없습니다.');
        }
    }

    /**
     * 상품의 Payapp URL 가져오기
     * @param {string} productId - 상품 ID
     * @returns {Promise<string|null>} Payapp URL 또는 null
     */
    async getProductPayappUrl(productId) {
        try {
            const { data: product, error } = await this.supabaseClient
                .from('products')
                .select('payapp_url')
                .eq('id', productId)
                .eq('is_active', true)
                .single();

            if (error) {
                console.error('상품 정보 가져오기 오류:', error);
                return null;
            }

            return product?.payapp_url || null;
        } catch (error) {
            console.error('Payapp URL 가져오기 오류:', error);
            return null;
        }
    }

    /**
     * Payapp 결제 시작
     * @param {string} productId - 상품 ID
     * @param {Object} userInfo - 사용자 정보
     * @returns {Promise<boolean>} 성공 여부
     */
    async initiatePayment(productId, userInfo) {
        try {
            // 사용자 인증 확인
            const { data: { user } } = await this.supabaseClient.auth.getUser();
            if (!user) {
                alert('로그인이 필요합니다.');
                window.location.href = '/auth.html?redirect=' + encodeURIComponent(window.location.href);
                return false;
            }

            // 상품 정보 가져오기
            const { data: product, error } = await this.supabaseClient
                .from('products')
                .select('*')
                .eq('id', productId)
                .eq('is_active', true)
                .single();

            if (error || !product) {
                alert('상품을 찾을 수 없습니다.');
                return false;
            }

            if (!product.payapp_url) {
                alert('결제 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.');
                return false;
            }

            // Custom data 준비
            const customData = {
                user_id: user.id,
                product_id: product.id,
                timestamp: new Date().toISOString()
            };

            // Payapp URL에 파라미터 추가
            const payappUrl = new URL(product.payapp_url);
            payappUrl.searchParams.set('custom_data', JSON.stringify(customData));
            payappUrl.searchParams.set('buyer_email', user.email);
            
            if (userInfo?.name) {
                payappUrl.searchParams.set('buyer_name', userInfo.name);
            }

            // Payapp 결제 페이지로 이동
            window.location.href = payappUrl.toString();
            return true;

        } catch (error) {
            console.error('결제 시작 오류:', error);
            alert('결제 처리 중 오류가 발생했습니다.');
            return false;
        }
    }

    /**
     * 결제 상태 확인
     * @param {string} transactionId - 거래 ID
     * @returns {Promise<Object|null>} 주문 정보 또는 null
     */
    async checkPaymentStatus(transactionId) {
        try {
            const { data: order, error } = await this.supabaseClient
                .from('orders')
                .select('*')
                .eq('payapp_transaction_id', transactionId)
                .single();

            if (error) {
                console.error('결제 상태 확인 오류:', error);
                return null;
            }

            return order;
        } catch (error) {
            console.error('결제 상태 확인 중 오류:', error);
            return null;
        }
    }

    /**
     * 사용자의 구매 내역 확인
     * @param {string} userId - 사용자 ID
     * @param {string} productId - 상품 ID (선택사항)
     * @returns {Promise<boolean>} 구매 여부
     */
    async checkUserPurchase(userId, productId = null) {
        try {
            let query = this.supabaseClient
                .from('purchased_content')
                .select('*')
                .eq('user_id', userId);

            if (productId) {
                query = query.eq('product_id', productId);
            }

            const { data: purchases, error } = await query;

            if (error) {
                console.error('구매 내역 확인 오류:', error);
                return false;
            }

            return purchases && purchases.length > 0;
        } catch (error) {
            console.error('구매 내역 확인 중 오류:', error);
            return false;
        }
    }

    /**
     * 관리자용: 상품별 Payapp URL 업데이트
     * @param {string} productId - 상품 ID
     * @param {string} payappUrl - Payapp URL
     * @returns {Promise<boolean>} 성공 여부
     */
    async updateProductPayappUrl(productId, payappUrl) {
        try {
            const { error } = await this.supabaseClient
                .from('products')
                .update({ payapp_url: payappUrl })
                .eq('id', productId);

            if (error) {
                console.error('Payapp URL 업데이트 오류:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Payapp URL 업데이트 중 오류:', error);
            return false;
        }
    }

    /**
     * 결제 완료 후 콘텐츠 접근 처리
     * @param {string} productId - 상품 ID
     * @returns {Promise<string>} 콘텐츠 URL
     */
    async accessPurchasedContent(productId) {
        try {
            const { data: { user } } = await this.supabaseClient.auth.getUser();
            if (!user) {
                throw new Error('로그인이 필요합니다.');
            }

            // 구매 여부 확인
            const hasPurchased = await this.checkUserPurchase(user.id, productId);
            if (!hasPurchased) {
                // 결제 페이지로 이동
                window.location.href = `/payment.html?product=${productId}`;
                return;
            }

            // 상품 정보 가져오기
            const { data: product, error } = await this.supabaseClient
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error || !product) {
                throw new Error('상품을 찾을 수 없습니다.');
            }

            // 콘텐츠 유형에 따라 적절한 뷰어로 이동
            let contentUrl;
            if (product.product_type === 'ebook') {
                contentUrl = `/ebook-viewer.html?content=${encodeURIComponent(product.content_url)}`;
            } else if (product.product_type === 'course') {
                contentUrl = `/video-viewer.html?content=${encodeURIComponent(product.content_url)}`;
            } else {
                contentUrl = product.content_url;
            }

            return contentUrl;

        } catch (error) {
            console.error('콘텐츠 접근 오류:', error);
            alert(error.message);
            return null;
        }
    }
}

// 전역 인스턴스 생성
window.payappIntegration = new PayappIntegration();

// 결제 버튼 이벤트 핸들러
function handlePayappPayment(productId, userInfo = {}) {
    return window.payappIntegration.initiatePayment(productId, userInfo);
}

// 콘텐츠 접근 핸들러
async function accessContent(productId) {
    const contentUrl = await window.payappIntegration.accessPurchasedContent(productId);
    if (contentUrl) {
        window.location.href = contentUrl;
    }
}

// 구매 확인 핸들러
async function checkPurchaseStatus(productId) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return false;
    
    return await window.payappIntegration.checkUserPurchase(user.id, productId);
}

// 페이지 로드 시 결제 상태 확인 (URL 파라미터에서)
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('transaction_id');
    const status = urlParams.get('status');
    
    if (transactionId && status === 'success') {
        // 결제 성공 처리
        showToast('결제가 완료되었습니다!', 'success');
        
        // 결제 상태 확인 후 콘텐츠 페이지로 이동
        setTimeout(async () => {
            const order = await window.payappIntegration.checkPaymentStatus(transactionId);
            if (order && order.product_id) {
                const contentUrl = await window.payappIntegration.accessPurchasedContent(order.product_id);
                if (contentUrl) {
                    window.location.href = contentUrl;
                }
            }
        }, 2000);
    } else if (transactionId && status === 'failed') {
        // 결제 실패 처리
        showToast('결제가 실패했습니다. 다시 시도해주세요.', 'error');
    }
});

// 토스트 메시지 함수 (없는 경우 추가)
function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
    } else {
        // 기본 토스트 구현
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}