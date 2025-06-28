// 상품 매핑 (자동으로 확장 가능)
let PRODUCTS = {};

// 기본 상품들
const DEFAULT_PRODUCTS = {
    'ebook1': { id: 'ebook1', title: 'Ebook 1탄', price: 87500 },
    'ebook2': { id: 'ebook2', title: 'Ebook 2탄', price: 87500 },
    'ai-master': { id: 'ai-master', title: 'AI 마스터 과정', price: 490000 }
};

// 상품 자동 감지 및 추가
async function initProducts() {
    PRODUCTS = { ...DEFAULT_PRODUCTS };
    
    // 새 상품 자동 감지 (랜딩페이지 기반)
    try {
        const response = await fetch('/');
        const html = await response.text();
        
        // 랜딩페이지 파일들 감지
        const landingPages = html.match(/(\w+)-landing\.html/g) || [];
        
        landingPages.forEach(page => {
            const productId = page.replace('-landing.html', '');
            if (!PRODUCTS[productId]) {
                PRODUCTS[productId] = {
                    id: productId,
                    title: productId.toUpperCase() + ' 과정',
                    price: 100000
                };
            }
        });
    } catch (error) {
        console.log('자동 상품 감지 실패, 기본 상품만 사용');
    }
}

// 할인코드 설정
const DISCOUNT_CODES = {
    'SPECIAL50': { type: 'percent', value: 50, active: true },
    'SAVE10000': { type: 'amount', value: 10000, active: true }
};

let currentProduct = null;
let userPoints = 0;
let appliedDiscount = null;
let cart = [];
let stockLeft = 47;
let discountEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간 후

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    await initProducts();
    await loadProduct();
    await loadUserInfo();
    initCartSystem();
    initRecommendations();
    startCountdown();
    startStockCounter();
    updatePayment();
});

// URL에서 상품 정보 로드
async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product');
    
    if (!productId || !PRODUCTS[productId]) {
        alert('잘못된 상품입니다.');
        window.location.href = '/';
        return;
    }
    
    currentProduct = PRODUCTS[productId];
    document.getElementById('product-title').textContent = currentProduct.title;
    document.getElementById('product-price').textContent = '₩' + currentProduct.price.toLocaleString();
}

// 사용자 정보 로드
async function loadUserInfo() {
    const user = await getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html';
        return;
    }
    
    // 임시 적립금
    userPoints = 5000;
    document.getElementById('user-points').textContent = userPoints.toLocaleString();
}

// 할인코드 적용
function applyDiscount() {
    const code = document.getElementById('discount-code').value.trim();
    const msg = document.getElementById('discount-msg');
    
    if (!code) {
        msg.innerHTML = '<small class="text-danger">코드를 입력하세요</small>';
        return;
    }
    
    if (DISCOUNT_CODES[code] && DISCOUNT_CODES[code].active) {
        appliedDiscount = DISCOUNT_CODES[code];
        msg.innerHTML = '<small class="text-success">할인코드 적용됨</small>';
    } else {
        appliedDiscount = null;
        msg.innerHTML = '<small class="text-danger">유효하지 않은 코드</small>';
    }
    
    updatePayment();
}

// 적립금 전액 사용
function useAllPoints() {
    document.getElementById('points').value = userPoints;
    updatePayment();
}

// 결제 금액 업데이트
function updatePayment() {
    if (!currentProduct) return;
    
    const pointsUsed = Math.min(parseInt(document.getElementById('points').value) || 0, userPoints);
    let price = currentProduct.price;
    let discountAmount = 0;
    
    // 할인 적용
    if (appliedDiscount) {
        if (appliedDiscount.type === 'percent') {
            discountAmount = Math.floor(price * appliedDiscount.value / 100);
        } else {
            discountAmount = appliedDiscount.value;
        }
    }
    
    const finalAmount = Math.max(0, price - discountAmount - pointsUsed);
    
    // UI 업데이트
    document.getElementById('original-price').textContent = '₩' + price.toLocaleString();
    document.getElementById('discount-amount').textContent = '-₩' + discountAmount.toLocaleString();
    document.getElementById('points-amount').textContent = '-₩' + pointsUsed.toLocaleString();
    document.getElementById('final-amount').textContent = '₩' + finalAmount.toLocaleString();
    
    // 적립금 검증
    const pointsMsg = document.getElementById('points-msg');
    if (pointsUsed > userPoints) {
        pointsMsg.innerHTML = '<small class="text-danger">보유 적립금 초과</small>';
        document.getElementById('points').value = userPoints;
    } else {
        pointsMsg.innerHTML = '';
    }
}

// 장바구니 시스템
function initCartSystem() {
    if (currentProduct) {
        cart = [currentProduct];
        renderCart();
    }
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="d-flex justify-content-between">
                <div>
                    <h6>${item.title}</h6>
                    <small class="text-muted">디지털 컨텐츠</small>
                </div>
                <div class="text-end">
                    <div class="h6 text-primary">₩${item.price.toLocaleString()}</div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCart('${item.id}')">제거</button>
                </div>
            </div>
        </div>
    `).join('');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updatePayment();
}

// 추천 시스템
function initRecommendations() {
    const recommendations = getRecommendations();
    const container = document.getElementById('recommended-items');
    container.innerHTML = recommendations.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <div>
                <small><strong>${item.title}</strong></small>
                <div class="text-muted small">₩${item.price.toLocaleString()}</div>
            </div>
            <button class="btn btn-sm btn-outline-primary" onclick="addToCart('${item.id}')">추가</button>
        </div>
    `).join('');
}

function getRecommendations() {
    const all = Object.values(DEFAULT_PRODUCTS);
    return all.filter(p => p.id !== currentProduct?.id).slice(0, 2);
}

function addToCart(productId) {
    const product = DEFAULT_PRODUCTS[productId];
    if (product && !cart.find(item => item.id === productId)) {
        cart.push(product);
        renderCart();
        updatePayment();
        showToast('상품이 추가되었습니다!', 'success');
    }
}

// 카운트다운 타이머
function startCountdown() {
    const timer = document.getElementById('discount-timer');
    setInterval(() => {
        const now = new Date();
        const diff = discountEndTime - now;
        
        if (diff <= 0) {
            timer.textContent = '00:00:00';
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// 실시간 재고 카운터
function startStockCounter() {
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% 확률로 재고 감소
            stockLeft = Math.max(1, stockLeft - Math.floor(Math.random() * 3));
            document.getElementById('stock-left').textContent = stockLeft;
            document.getElementById('stock-left-detail').textContent = stockLeft + '석';
            
            // 수강생 수도 증가
            const current = parseInt(document.getElementById('current-students').textContent.replace(/[^0-9]/g, ''));
            document.getElementById('current-students').textContent = (current + Math.floor(Math.random() * 5)) + '명';
        }
    }, 5000);
}

// 로딩 상태 관리
function setLoadingState(loading) {
    const btn = document.getElementById('pay-btn');
    if (loading) {
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner"></div> 결제 처리 중...';
    } else {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> 안전하게 수강 신청하기';
    }
}

// 오류 처리
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// 토스트 메시지
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 결제 처리 (개선된 버전)
async function processPay() {
    try {
        setLoadingState(true);
        
        const method = document.querySelector('input[name="payment-method"]:checked').value;
        const pointsUsed = parseInt(document.getElementById('points').value) || 0;
        const finalAmount = parseInt(document.getElementById('final-amount').textContent.replace(/[^0-9]/g, ''));
        
        // 진행률 업데이트
        document.querySelector('.progress-steps .step.active').classList.remove('active');
        document.querySelector('.progress-steps .step.active').classList.add('completed');
        document.querySelector('.progress-steps .step:last-child').classList.add('active');
        
        // 결제 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (finalAmount === 0) {
            await completeOrder();
            return;
        }
        
        // 실제 결제 처리 로직
        await completeOrder();
        
    } catch (error) {
        setLoadingState(false);
        showError('결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        
        // 진행률 복구
        document.querySelector('.progress-steps .step:last-child').classList.remove('active');
        document.querySelector('.progress-steps .step:nth-child(2)').classList.add('active');
    }
}

// 주문 완료
async function completeOrder() {
    setLoadingState(false);
    
    // 성공 메시지
    showToast('결제가 완료되었습니다!', 'success');
    
    // 2초 후 콘텐츠 페이지로 이동
    setTimeout(() => {
        if (currentProduct.id === 'ebook1' || currentProduct.id === 'ebook2') {
            window.location.href = `purchased-content.html?id=${currentProduct.id}`;
        } else {
            window.location.href = `purchased-content.html?id=${currentProduct.id}`;
        }
    }, 2000);
}

// 결제 금액 업데이트 (장바구니 고려)
function updatePayment() {
    if (cart.length === 0) return;
    
    const pointsInput = document.getElementById('points');
    const pointsUsed = Math.min(parseInt(pointsInput.value) || 0, userPoints);
    let totalPrice = cart.reduce((sum, item) => sum + item.price, 0);
    let discountAmount = 0;
    
    // 할인 적용
    if (appliedDiscount) {
        if (appliedDiscount.type === 'percent') {
            discountAmount = Math.floor(totalPrice * appliedDiscount.value / 100);
        } else {
            discountAmount = appliedDiscount.value;
        }
    }
    
    const finalAmount = Math.max(0, totalPrice - discountAmount - pointsUsed);
    
    // UI 업데이트
    document.getElementById('original-price').textContent = '₩' + totalPrice.toLocaleString();
    document.getElementById('discount-amount').textContent = '-₩' + discountAmount.toLocaleString();
    document.getElementById('points-amount').textContent = '-₩' + pointsUsed.toLocaleString();
    document.getElementById('final-amount').textContent = '₩' + finalAmount.toLocaleString();
    
    // 적립금 검증
    const pointsMsg = document.getElementById('points-msg');
    if (pointsUsed > userPoints) {
        pointsMsg.innerHTML = '<small class="text-danger">보유 적립금 초과</small>';
        pointsInput.value = userPoints;
    } else {
        pointsMsg.innerHTML = '';
    }
}

// 적립금 입력 시 업데이트
document.getElementById('points').addEventListener('input', updatePayment);