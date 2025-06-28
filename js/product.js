// 상품 상세 페이지 JavaScript
let currentProduct = null;
let userRating = 0;

document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
    setupProductEvents();
    setupReviewEvents();
});

// 상품 페이지 초기화
async function initializeProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showToast('유효하지 않은 상품입니다.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    try {
        // 상품 정보 로드
        await loadProductInfo(productId);
        
        // 관련 상품 로드
        await loadRelatedProducts(productId);
        
        // 상품 후기 로드
        await loadProductReviews(productId);
        
        // 사용자 인증 상태 확인
        await checkUserAuth();
        
    } catch (error) {
        console.error('상품 페이지 초기화 오류:', error);
        showProductError();
    }
}

// 상품 정보 로드
async function loadProductInfo(productId) {
    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }
        
        const { data: product, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .eq('is_active', true)
            .single();
        
        if (error) {
            throw error;
        }
        
        if (!product) {
            throw new Error('상품을 찾을 수 없습니다');
        }
        
        currentProduct = product;
        renderProductInfo(product);
        
    } catch (error) {
        console.error('상품 정보 로드 오류:', error);
        throw error;
    }
}

// 상품 정보 렌더링
function renderProductInfo(product) {
    // 로딩 상태 숨김
    document.getElementById('product-loading').classList.add('d-none');
    document.getElementById('product-content').classList.remove('d-none');
    
    // 기본 정보
    document.getElementById('product-image').src = product.image_url || 'https://via.placeholder.com/400x300';
    document.getElementById('product-image').alt = product.title;
    document.getElementById('product-category').textContent = product.type === 'lecture' ? '강의' : '전자책';
    document.getElementById('product-category').className = `badge bg-${product.type === 'lecture' ? 'primary' : 'warning'} mb-2`;
    document.getElementById('product-title').textContent = product.title;
    document.getElementById('product-description').textContent = product.description;
    document.getElementById('product-price').textContent = `₩${product.price.toLocaleString()}`;
    
    // 평점 표시 (임시 데이터)
    const rating = 4.5;
    const reviewCount = 128;
    document.getElementById('product-rating').innerHTML = generateStars(rating);
    document.getElementById('review-count').textContent = reviewCount;
    
    // 구매 패널
    document.getElementById('panel-image').src = product.image_url || 'https://via.placeholder.com/150x100';
    document.getElementById('panel-image').alt = product.title;
    document.getElementById('panel-title').textContent = product.title;
    document.getElementById('panel-price').textContent = `₩${product.price.toLocaleString()}`;
    document.getElementById('purchase-info').classList.remove('d-none');
    
    // 상품 유형별 탭 설정
    if (product.type === 'lecture') {
        document.getElementById('curriculum-tab-li').style.display = 'block';
        loadLectureCurriculum(product);
    }
    
    // 상세 설명
    document.getElementById('product-overview').innerHTML = `
        <h5>상품 소개</h5>
        <p>${product.description}</p>
        <h6>주요 특징</h6>
        <ul>
            <li>전문가가 제작한 고품질 콘텐츠</li>
            <li>평생 소장 가능</li>
            <li>모든 기기에서 학습 가능</li>
            <li>24시간 고객 지원</li>
        </ul>
    `;
    
    // 페이지 제목 업데이트
    document.title = `${product.title} - 교육플랫폼`;
}

// 강의 커리큘럼 로드
function loadLectureCurriculum(product) {
    const curriculumContainer = document.getElementById('lecture-curriculum');
    
    // 임시 커리큘럼 데이터
    const curriculum = [
        {
            title: '1장. 기초 개념',
            duration: '45분',
            lessons: [
                { title: '강의 소개', duration: '5분', type: 'video' },
                { title: '기본 개념 이해', duration: '20분', type: 'video' },
                { title: '실습 환경 설정', duration: '20분', type: 'video' }
            ]
        },
        {
            title: '2장. 심화 학습',
            duration: '60분',
            lessons: [
                { title: '고급 기능 활용', duration: '30분', type: 'video' },
                { title: '실제 프로젝트 적용', duration: '30분', type: 'video' }
            ]
        },
        {
            title: '3장. 마무리',
            duration: '30분',
            lessons: [
                { title: '정리 및 복습', duration: '20분', type: 'video' },
                { title: '다음 단계 안내', duration: '10분', type: 'video' }
            ]
        }
    ];
    
    const curriculumHtml = curriculum.map((chapter, index) => `
        <div class="curriculum-item">
            <div class="curriculum-header" data-bs-toggle="collapse" data-bs-target="#chapter-${index}">
                <h6>${chapter.title}</h6>
                <div class="curriculum-duration">
                    <span class="text-muted">${chapter.duration}</span>
                    <i class="fas fa-chevron-down ms-2"></i>
                </div>
            </div>
            <div id="chapter-${index}" class="collapse">
                <div class="curriculum-content">
                    <ul class="lesson-list">
                        ${chapter.lessons.map(lesson => `
                            <li class="lesson-item">
                                <div class="lesson-title">
                                    <i class="fas fa-${lesson.type === 'video' ? 'play-circle' : 'file-alt'} lesson-icon"></i>
                                    <span>${lesson.title}</span>
                                </div>
                                <span class="lesson-duration text-muted">${lesson.duration}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
    
    curriculumContainer.innerHTML = curriculumHtml;
}

// 관련 상품 로드
async function loadRelatedProducts(currentProductId) {
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('is_active', true)
            .neq('id', currentProductId)
            .limit(4);
        
        if (error) {
            console.error('관련 상품 로드 오류:', error);
            return;
        }
        
        renderRelatedProducts(products || []);
        
    } catch (error) {
        console.error('관련 상품 처리 오류:', error);
    }
}

// 관련 상품 렌더링
function renderRelatedProducts(products) {
    const container = document.getElementById('related-products');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <p class="text-muted">관련 상품이 없습니다.</p>
            </div>
        `;
        return;
    }
    
    const productsHtml = products.map(product => `
        <div class="col-lg-3 col-md-6 mb-4">
            <a href="product-detail.html?id=${product.id}" class="related-product">
                <img src="${product.image_url || 'https://via.placeholder.com/200x150'}" 
                     class="related-product-image w-100" alt="${product.title}">
                <div class="related-product-content">
                    <h6 class="related-product-title">${product.title}</h6>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="related-product-price">₩${product.price.toLocaleString()}</span>
                        <span class="badge bg-${product.type === 'lecture' ? 'primary' : 'warning'}">
                            ${product.type === 'lecture' ? '강의' : '전자책'}
                        </span>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
    
    container.innerHTML = productsHtml;
}

// 상품 후기 로드
async function loadProductReviews(productId) {
    try {
        const { data: reviews, error } = await supabaseClient
            .from('reviews')
            .select(`
                *,
                users(name)
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('후기 로드 오류:', error);
            return;
        }
        
        renderProductReviews(reviews || []);
        
    } catch (error) {
        console.error('후기 처리 오류:', error);
    }
}

// 상품 후기 렌더링
function renderProductReviews(reviews) {
    const container = document.getElementById('reviews-section');
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-star fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">아직 후기가 없습니다</h5>
                <p class="text-muted">첫 번째 후기를 남겨보세요!</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#reviewModal">
                    <i class="fas fa-star me-2"></i>후기 작성하기
                </button>
            </div>
        `;
        return;
    }
    
    const reviewsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5>고객 후기 (${reviews.length})</h5>
            <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#reviewModal">
                <i class="fas fa-edit me-2"></i>후기 작성
            </button>
        </div>
        <div class="row">
            ${reviews.map(review => `
                <div class="col-12 mb-4">
                    <div class="review-item">
                        <div class="review-header">
                            <div class="reviewer-info">
                                <div class="reviewer-avatar">
                                    ${(review.users?.name || '익명').charAt(0)}
                                </div>
                                <div>
                                    <div class="reviewer-name">${review.users?.name || '익명'}</div>
                                    <div class="reviewer-date">
                                        ${new Date(review.created_at).toLocaleDateString('ko-KR')}
                                    </div>
                                </div>
                            </div>
                            <div class="review-rating">
                                ${generateStars(review.rating)}
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.content}</p>
                        </div>
                        <div class="review-helpful">
                            <small class="text-muted">이 후기가 도움이 되셨나요?</small>
                            <div class="helpful-buttons">
                                <button class="helpful-btn" data-action="helpful">
                                    <i class="fas fa-thumbs-up me-1"></i>도움됨 (${review.helpful_count || 0})
                                </button>
                                <button class="helpful-btn" data-action="report">
                                    <i class="fas fa-flag me-1"></i>신고
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = reviewsHtml;
}

// 별점 생성 함수
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// 사용자 인증 확인
async function checkUserAuth() {
    try {
        const user = await getCurrentUser();
        const purchaseBtn = document.getElementById('purchase-btn');
        const buyNowBtn = document.getElementById('buy-now-btn');
        
        if (user) {
            // 구매 이력 확인
            const hasPurchased = await checkPurchaseHistory(user.id, currentProduct.id);
            
            if (hasPurchased) {
                // 이미 구매한 경우
                purchaseBtn.innerHTML = '<i class="fas fa-play me-2"></i>지금 보기';
                purchaseBtn.className = 'btn btn-success btn-lg w-100 mb-2';
                purchaseBtn.onclick = () => {
                    window.location.href = `purchased-content.html?id=${currentProduct.id}`;
                };
                
                buyNowBtn.innerHTML = '<i class="fas fa-play me-2"></i>지금 보기';
                buyNowBtn.className = 'btn btn-success btn-lg';
                buyNowBtn.onclick = () => {
                    window.location.href = `purchased-content.html?id=${currentProduct.id}`;
                };
            }
        } else {
            // 로그인하지 않은 경우
            purchaseBtn.onclick = () => {
                window.location.href = `auth.html?return=${encodeURIComponent(window.location.href)}`;
            };
            
            buyNowBtn.onclick = () => {
                window.location.href = `auth.html?return=${encodeURIComponent(window.location.href)}`;
            };
        }
    } catch (error) {
        console.error('사용자 인증 확인 오류:', error);
    }
}

// 구매 이력 확인
async function checkPurchaseHistory(userId, productId) {
    try {
        const { data, error } = await supabaseClient
            .from('access_rights')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        
        return !error && data;
    } catch (error) {
        console.error('구매 이력 확인 오류:', error);
        return false;
    }
}

// 상품 이벤트 설정
function setupProductEvents() {
    // 구매 버튼 이벤트
    document.getElementById('purchase-btn')?.addEventListener('click', handlePurchaseClick);
    document.getElementById('buy-now-btn')?.addEventListener('click', handlePurchaseClick);
    document.getElementById('add-cart-btn')?.addEventListener('click', handleAddToCart);
    
    // 미리보기 버튼
    document.getElementById('preview-btn')?.addEventListener('click', handlePreview);
    
    // 결제 방법 선택
    document.querySelectorAll('.payment-method').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // 결제 확인
    document.getElementById('confirm-payment')?.addEventListener('click', handlePaymentConfirm);
}

// 구매 버튼 클릭 처리
async function handlePurchaseClick() {
    const user = await getCurrentUser();
    
    if (!user) {
        window.location.href = `auth.html?return=${encodeURIComponent(window.location.href)}`;
        return;
    }
    
    // 이미 구매한 경우
    const hasPurchased = await checkPurchaseHistory(user.id, currentProduct.id);
    if (hasPurchased) {
        window.location.href = `purchased-content.html?id=${currentProduct.id}`;
        return;
    }
    
    // 결제 모달 표시
    showPaymentModal();
}

// 장바구니 추가
function handleAddToCart() {
    // 장바구니 기능 (향후 구현)
    showToast('장바구니 기능은 곧 추가될 예정입니다.', 'info');
}

// 미리보기
function handlePreview() {
    if (currentProduct.type === 'lecture') {
        // YouTube 미리보기
        if (currentProduct.youtube_url) {
            const videoId = extractYouTubeVideoId(currentProduct.youtube_url);
            if (videoId) {
                window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
            }
        }
    } else {
        // 전자책 미리보기
        showToast('전자책 미리보기는 구매 후 이용 가능합니다.', 'info');
    }
}

// YouTube 비디오 ID 추출
function extractYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// 결제 모달 표시
function showPaymentModal() {
    if (!currentProduct) return;
    
    document.getElementById('payment-product-title').textContent = currentProduct.title;
    document.getElementById('payment-product-price').textContent = `₩${currentProduct.price.toLocaleString()}`;
    document.getElementById('payment-total').textContent = `₩${currentProduct.price.toLocaleString()}`;
    
    const modal = new bootstrap.Modal(document.getElementById('paymentModal'));
    modal.show();
}

// 결제 확인 처리
async function handlePaymentConfirm() {
    const selectedMethod = document.querySelector('.payment-method.selected');
    
    if (!selectedMethod) {
        showToast('결제 방법을 선택해주세요.', 'warning');
        return;
    }
    
    const user = await getCurrentUser();
    if (!user) {
        showToast('로그인이 필요합니다.', 'error');
        return;
    }
    
    try {
        // 결제 처리 (TossPay 연동)
        await processPayment(selectedMethod.dataset.method);
        
    } catch (error) {
        console.error('결제 처리 오류:', error);
        showToast('결제 처리 중 오류가 발생했습니다.', 'error');
    }
}

// 결제 처리
async function processPayment(paymentMethod) {
    // TossPay 결제 처리 로직
    // 실제 구현에서는 TossPay SDK를 사용
    
    const paymentData = {
        orderId: 'order_' + Date.now(),
        amount: currentProduct.price,
        orderName: currentProduct.title,
        customerName: (await getCurrentUser()).email,
        successUrl: `${window.location.origin}/payment-success.html`,
        failUrl: `${window.location.origin}/payment-fail.html`
    };
    
    // 임시 성공 처리
    setTimeout(async () => {
        await handlePaymentSuccess(paymentData);
    }, 1000);
}

// 결제 성공 처리
async function handlePaymentSuccess(paymentData) {
    try {
        const user = await getCurrentUser();
        
        // 주문 생성
        const { data: order, error: orderError } = await supabaseClient
            .from('orders')
            .insert([{
                user_id: user.id,
                product_id: currentProduct.id,
                total_amount: currentProduct.price,
                status: 'completed',
                payment_method: 'card',
                order_id: paymentData.orderId,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (orderError) {
            throw orderError;
        }
        
        // 접근 권한 부여
        const { error: accessError } = await supabaseClient
            .from('access_rights')
            .insert([{
                user_id: user.id,
                product_id: currentProduct.id,
                granted_at: new Date().toISOString()
            }]);
        
        if (accessError) {
            throw accessError;
        }
        
        // 결제 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
        modal.hide();
        
        // 성공 메시지
        showToast('결제가 완료되었습니다! 콘텐츠를 확인해보세요.', 'success');
        
        // 페이지 새로고침으로 구매 상태 업데이트
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('결제 성공 처리 오류:', error);
        showToast('결제 처리 중 오류가 발생했습니다.', 'error');
    }
}

// 후기 이벤트 설정
function setupReviewEvents() {
    // 후기 평점 선택
    document.querySelectorAll('.rating-input input').forEach(input => {
        input.addEventListener('change', function() {
            userRating = parseInt(this.value);
        });
    });
    
    // 후기 제출
    document.getElementById('submit-review')?.addEventListener('click', submitReview);
}

// 후기 제출
async function submitReview() {
    const user = await getCurrentUser();
    
    if (!user) {
        showToast('로그인이 필요합니다.', 'error');
        return;
    }
    
    if (userRating === 0) {
        showToast('평점을 선택해주세요.', 'warning');
        return;
    }
    
    const reviewText = document.getElementById('reviewText').value.trim();
    
    if (!reviewText) {
        showToast('후기 내용을 입력해주세요.', 'warning');
        return;
    }
    
    try {
        // 구매 이력 확인
        const hasPurchased = await checkPurchaseHistory(user.id, currentProduct.id);
        
        if (!hasPurchased) {
            showToast('구매한 상품에만 후기를 남길 수 있습니다.', 'warning');
            return;
        }
        
        // 후기 저장
        const { error } = await supabaseClient
            .from('reviews')
            .insert([{
                user_id: user.id,
                product_id: currentProduct.id,
                rating: userRating,
                content: reviewText,
                created_at: new Date().toISOString()
            }]);
        
        if (error) {
            throw error;
        }
        
        showToast('후기가 등록되었습니다.', 'success');
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('reviewModal'));
        modal.hide();
        
        // 폼 초기화
        document.getElementById('reviewForm').reset();
        userRating = 0;
        
        // 후기 목록 새로고침
        await loadProductReviews(currentProduct.id);
        
    } catch (error) {
        console.error('후기 등록 오류:', error);
        showToast('후기 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 상품 오류 표시
function showProductError() {
    document.getElementById('product-loading').classList.add('d-none');
    document.getElementById('product-content').innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-5x text-warning mb-4"></i>
            <h3>상품을 불러올 수 없습니다</h3>
            <p class="text-muted mb-4">요청하신 상품이 존재하지 않거나 일시적으로 이용할 수 없습니다.</p>
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-home me-2"></i>홈으로 돌아가기
            </a>
        </div>
    `;
}

// 도움됨 버튼 이벤트
document.addEventListener('click', function(e) {
    if (e.target.closest('.helpful-btn')) {
        const btn = e.target.closest('.helpful-btn');
        const action = btn.dataset.action;
        
        if (action === 'helpful') {
            btn.classList.toggle('active');
            // 실제 구현에서는 서버에 도움됨 카운트 업데이트
        } else if (action === 'report') {
            showToast('신고가 접수되었습니다.', 'info');
        }
    }
});
