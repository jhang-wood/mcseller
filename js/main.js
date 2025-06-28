// 메인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // 페이지 초기화
    initializePage();
    
    // 스무스 스크롤
    initializeSmoothScroll();
    
    // 상품 데이터 로드
    loadProducts();
    
    // 후기 데이터 로드
    loadReviews();
    
    // 내비게이션 이벤트
    setupNavigation();
});

// 페이지 초기화
function initializePage() {
    // 로딩 애니메이션
    const elements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
            }
        });
    });
    
    elements.forEach(el => observer.observe(el));
    
    // 현재 사용자 상태 확인
    checkUserStatus();
}

// 사용자 상태 확인
async function checkUserStatus() {
    if (!window.supabaseClient) return;
    
    try {
        const user = await getCurrentUser();
        if (user) {
            updateUIForLoggedInUser(user);
        }
    } catch (error) {
        console.error('사용자 상태 확인 오류:', error);
    }
}

// 로그인된 사용자 UI 업데이트
function updateUIForLoggedInUser(user) {
    // 내 콘텐츠 버튼 이벤트 추가
    const myContentBtn = document.getElementById('my-content');
    if (myContentBtn) {
        myContentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMyContent();
        });
    }
}

// 내 콘텐츠 표시
async function showMyContent() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'auth.html';
            return;
        }
        
        // 구매한 콘텐츠 조회
        const { data: purchases, error } = await supabaseClient
            .from('access_rights')
            .select(`
                product_id,
                created_at,
                products (
                    id,
                    title,
                    type,
                    image_url,
                    price
                )
            `)
            .eq('user_id', user.id);
        
        if (error) {
            console.error('구매 내역 조회 오류:', error);
            showToast('구매 내역을 불러올 수 없습니다.', 'error');
            return;
        }
        
        if (purchases.length === 0) {
            showToast('구매한 콘텐츠가 없습니다.', 'info');
            return;
        }
        
        // 구매한 콘텐츠 모달 표시
        showMyContentModal(purchases);
        
    } catch (error) {
        console.error('내 콘텐츠 조회 오류:', error);
        showToast('오류가 발생했습니다.', 'error');
    }
}

// 구매한 콘텐츠 모달 표시
function showMyContentModal(purchases) {
    const modalHtml = `
        <div class="modal fade" id="myContentModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">내 강의/책</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            ${purchases.map(purchase => `
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <img src="${purchase.products.image_url || 'https://via.placeholder.com/300x200'}" 
                                             class="card-img-top" style="height: 150px; object-fit: cover;" 
                                             alt="${purchase.products.title}">
                                        <div class="card-body">
                                            <span class="badge bg-${purchase.products.type === 'lecture' ? 'primary' : 'warning'} mb-2">
                                                ${purchase.products.type === 'lecture' ? '강의' : '전자책'}
                                            </span>
                                            <h6 class="card-title">${purchase.products.title}</h6>
                                            <p class="text-muted small">
                                                구매일: ${new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                                            </p>
                                            <a href="purchased-content.html?id=${purchase.products.id}" 
                                               class="btn btn-primary btn-sm w-100">
                                                <i class="fas fa-play me-2"></i>보기
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거
    const existingModal = document.getElementById('myContentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 새 모달 추가
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 모달 표시
    const modal = new bootstrap.Modal(document.getElementById('myContentModal'));
    modal.show();
    
    // 모달이 숨겨진 후 DOM에서 제거
    document.getElementById('myContentModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// 스무스 스크롤 초기화
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 상품 데이터 로드
async function loadProducts() {
    try {
        // 강의 로드
        await loadLectures();
        
        // 전자책 로드
        await loadEbooks();
        
    } catch (error) {
        console.error('상품 로드 오류:', error);
        showProductLoadError();
    }
}

// 강의 로드
async function loadLectures() {
    const container = document.getElementById('lectures-container');
    if (!container) return;
    
    try {
        // Static data를 사용하여 강의 로드
        const lectures = window.ProductService ? 
            window.ProductService.getByType('lectures') : 
            [];
        
        renderProducts(lectures, container, 'lecture');
        
    } catch (error) {
        console.error('강의 로드 처리 오류:', error);
        showProductLoadError(container);
    }
}

// 전자책 로드
async function loadEbooks() {
    const container = document.getElementById('ebooks-container');
    if (!container) return;
    
    try {
        // Static data를 사용하여 전자책 로드
        const ebooks = window.ProductService ? 
            window.ProductService.getByType('ebooks') : 
            [];
        
        renderProducts(ebooks, container, 'ebook');
        
    } catch (error) {
        console.error('전자책 로드 처리 오류:', error);
        showProductLoadError(container);
    }
}

// 상품 렌더링
function renderProducts(products, container, type) {
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-${type === 'lecture' ? 'video' : 'book'} fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">등록된 ${type === 'lecture' ? '강의' : '전자책'}가 없습니다</h5>
                <p class="text-muted">곧 새로운 콘텐츠가 업데이트될 예정입니다.</p>
            </div>
        `;
        return;
    }
    
    const productsHtml = products.map(product => `
        <div class="col-lg-4 col-md-6 mb-4 fade-in">
            <div class="product-card card h-100">
                <img src="${product.image || product.image_url || 'https://via.placeholder.com/300x200'}" 
                     class="card-img-top" alt="${product.title}">
                <div class="card-body">
                    <span class="badge bg-${type === 'lecture' ? 'primary' : 'warning'} mb-2">
                        ${type === 'lecture' ? '강의' : '전자책'}
                    </span>
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-text">${product.description}</p>
                    <div class="product-rating mb-2">
                        <div class="stars">
                            ${generateStars(product.rating || 4.5)}
                        </div>
                        <span class="text-muted ms-2">(${product.totalStudents || product.totalReaders || 128})</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="product-price">₩${product.price.toLocaleString()}</span>
                        <a href="product-detail.html?id=${product.id}" class="btn btn-primary btn-sm">
                            <i class="fas fa-${type === 'lecture' ? 'play' : 'book'} me-1"></i>
                            ${type === 'lecture' ? '수강하기' : '읽기'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = productsHtml;
}

// 별점 생성
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHtml = '';
    
    // 채워진 별
    for (let i = 0; i < fullStars; i++) {
        starsHtml += '<i class="fas fa-star"></i>';
    }
    
    // 반 별
    if (hasHalfStar) {
        starsHtml += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // 빈 별
    for (let i = 0; i < emptyStars; i++) {
        starsHtml += '<i class="far fa-star"></i>';
    }
    
    return starsHtml;
}

// 상품 로드 오류 표시
function showProductLoadError(container) {
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                <h5 class="text-muted">콘텐츠를 불러올 수 없습니다</h5>
                <p class="text-muted">네트워크 연결을 확인하고 페이지를 새로고침해 주세요.</p>
                <button class="btn btn-primary" onclick="window.location.reload()">
                    <i class="fas fa-redo me-2"></i>새로고침
                </button>
            </div>
        `;
    }
}

// 후기 데이터 로드
async function loadReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    try {
        // 실제 서비스에서는 OCR로 추출된 후기를 사용
        // 현재는 정적 데이터 사용
        const reviews = getStaticReviews();
        renderReviews(reviews, container);
        
    } catch (error) {
        console.error('후기 로드 오류:', error);
        showReviewsLoadError(container);
    }
}

// 정적 후기 데이터 (OCR 추출 시뮬레이션)
function getStaticReviews() {
    return [
        {
            id: 1,
            author: '김○○',
            rating: 5,
            content: '강의 내용이 정말 알차고 이해하기 쉽게 설명해주셔서 많은 도움이 되었습니다. 추천합니다!',
            date: '2025-01-15',
            product_title: 'JavaScript 마스터클래스'
        },
        {
            id: 2,
            author: '이○○',
            rating: 5,
            content: '전자책의 구성이 체계적이고 실무에서 바로 적용할 수 있는 내용들이 많아서 좋았습니다.',
            date: '2025-01-10',
            product_title: '웹 개발 완벽 가이드'
        },
        {
            id: 3,
            author: '박○○',
            rating: 4,
            content: '초보자도 따라할 수 있게 친절하게 설명되어 있어서 만족합니다. 다음 강의도 기대됩니다.',
            date: '2025-01-05',
            product_title: 'React 입문부터 실전까지'
        }
    ];
}

// 후기 렌더링
function renderReviews(reviews, container) {
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-star fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">등록된 후기가 없습니다</h5>
                <p class="text-muted">첫 번째 후기를 남겨보세요!</p>
            </div>
        `;
        return;
    }
    
    const reviewsHtml = reviews.map(review => `
        <div class="col-lg-4 col-md-6 mb-4 fade-in">
            <div class="review-card">
                <div class="review-header">
                    <div class="review-avatar">
                        ${review.author.charAt(0)}
                    </div>
                    <div>
                        <div class="review-author">${review.author}</div>
                        <div class="review-date">${new Date(review.date).toLocaleDateString('ko-KR')}</div>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-content">
                    <p>"${review.content}"</p>
                    <small class="text-muted">- ${review.product_title}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = reviewsHtml;
}

// 후기 로드 오류 표시
function showReviewsLoadError(container) {
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
            <h5 class="text-muted">후기를 불러올 수 없습니다</h5>
            <p class="text-muted">잠시 후 다시 시도해 주세요.</p>
        </div>
    `;
}

// 내비게이션 이벤트 설정
function setupNavigation() {
    // 스크롤 시 내비게이션 바 스타일 변경
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
    
    // 모바일 메뉴 자동 닫기
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbarCollapse.classList.contains('show')) {
                navbarToggler.click();
            }
        });
    });
}

// 페이지 성능 최적화
document.addEventListener('DOMContentLoaded', function() {
    // 이미지 지연 로딩
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }
    
    // 서비스 워커 등록 (PWA 대응)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('서비스 워커 등록 성공:', registration);
            })
            .catch(error => {
                console.log('서비스 워커 등록 실패:', error);
            });
    }
});

// 전역 함수로 내보내기
window.loadProducts = loadProducts;
window.showMyContent = showMyContent;
