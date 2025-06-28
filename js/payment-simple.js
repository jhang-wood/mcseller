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

// 페이지 로드
document.addEventListener('DOMContentLoaded', async () => {
    await initProducts();
    await loadProduct();
    await loadUserInfo();
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
    
    // 임시 적립금 (실제로는 DB에서)
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

// 결제 처리
async function processPay() {
    const method = document.querySelector('input[name="payment-method"]:checked').value;
    const pointsUsed = parseInt(document.getElementById('points').value) || 0;
    const finalAmount = parseInt(document.getElementById('final-amount').textContent.replace(/[^0-9]/g, ''));
    
    if (finalAmount === 0) {
        // 무료 결제
        await completeOrder();
        return;
    }
    
    // 실제 결제 처리 (TossPay 등)
    alert(`${method} 결제: ${finalAmount.toLocaleString()}원`);
    await completeOrder();
}

// 주문 완료
async function completeOrder() {
    // DB 저장 로직
    alert('결제가 완료되었습니다!');
    window.location.href = `purchased-content.html?id=${currentProduct.id}`;
}

// 적립금 입력 시 업데이트
document.getElementById('points').addEventListener('input', updatePayment);