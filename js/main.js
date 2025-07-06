/**
 * MCSELLER 메인 페이지 스크립트 (리팩토링 버전)
 * - 데이터 로딩을 정적 데이터에서 Supabase DB로 완전히 전환합니다.
 * - 상품 클릭 시 불필요한 DB 조회를 제거하여 성능을 개선합니다.
 * - 이벤트 리스너를 통합하고 이벤트 위임을 사용하여 코드를 최적화합니다.
 */

// ===================================================================================
//  페이지 초기화
// ===================================================================================

// DOM과 Supabase 클라이언트가 준비되면 페이지 로직을 시작합니다.
document.addEventListener("DOMContentLoaded", function() {
    console.log("메인페이지 DOM 로드 완료");
    
    // Supabase 클라이언트 대기
    function waitForSupabase() {
        if (window.supabaseClient) {
            console.log("✅ Supabase 클라이언트 확인 완료");
            initializeMainPage();
        } else {
            console.log("Supabase 클라이언트 대기 중...");
            setTimeout(waitForSupabase, 100);
        }
    }
    
    // 약간의 지연 후 시작하여 모든 스크립트가 로드되도록 함
    setTimeout(waitForSupabase, 500);

    // 로그인 버튼 클릭 시 로그인 페이지로 이동
    const loginInfo = document.getElementById("login-info");
    if (loginInfo) {
        const loginBtn = loginInfo.querySelector("a");
        if (loginBtn) {
            loginBtn.addEventListener("click", function(e) {
                e.preventDefault();
                window.location.href = "auth.html";
            });
        }
    }

    // 로그아웃 버튼 클릭 시 Supabase 로그아웃
    const logoutBtn = document.getElementById("profile-logout-link");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async function(e) {
            e.preventDefault();
            if (window.supabaseClient) {
                await window.supabaseClient.auth.signOut();
                updateUIAccordingToAuthState();
            }
        });
    }

    // 마이페이지 이동
    const mypageBtn = document.getElementById("profile-mypage-link");
    if (mypageBtn) {
        mypageBtn.addEventListener("click", function(e) {
            e.preventDefault();
            window.location.href = "mypage.html";
        });
    }
});

// 페이지 재로드 시에도 초기화 (로그인 후 돌아올 때)
window.addEventListener('pageshow', function(event) {
    // 뒤로가기나 새로고침으로 페이지에 돌아온 경우
    if (event.persisted || window.performance.navigation.type === 2) {
        console.log("페이지 재진입 감지 - 재초기화");
        setTimeout(() => {
            if (window.supabaseClient) {
                updateUIAccordingToAuthState();
            }
        }, 100);
    }
});

// 인증 상태 변경 감지를 setupAuthStateListener에서 처리

function initializeMainPage() {
    console.log("✅ Supabase 준비 완료. 메인 페이지 로직을 초기화합니다.");

    // UI/UX 기능 초기화
    initializeAnimations();
    initializeSmoothScroll();
    setupNavigation();

    // 데이터 로딩 및 이벤트 설정
    loadProductsAndSetupHandlers(); // 상품 로드와 클릭 핸들러 설정을 통합
    loadReviews();

    // 로그인 상태에 따른 UI 업데이트
    updateUIAccordingToAuthState();

    // PWA 및 성능 최적화
    initializePerformanceOptimizations();
    
    // 인증 상태 변경 리스너 설정
    setupAuthStateListener();
}

// 인증 상태 변경 리스너 설정
function setupAuthStateListener() {
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('인증 상태 변경:', event, session?.user?.email);
            
            // 로그인/로그아웃 시 UI 즉시 업데이트
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                setTimeout(() => {
                    updateUIAccordingToAuthState();
                }, 100);
            }
        });
        console.log("✅ 인증 상태 변경 리스너 설정 완료");
    }
}

// ===================================================================================
//  인증 및 UI 업데이트
// ===================================================================================

// 인증 상태에 따라 UI를 업데이트하는 중앙 함수
async function updateUIAccordingToAuthState() {
    try {
        // 현재 세션 확인
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        console.log("현재 세션 상태:", session ? "로그인됨" : "로그아웃됨");
        
        if (session && session.user) {
            // 로그인 상태 UI 업데이트
            console.log("✅ 로그인됨:", session.user.email);
            
            const loginInfo = document.getElementById("login-info");
            const profileDropdown = document.getElementById("profile-dropdown");
            const startButton = document.getElementById("start-button");
            
            // 로그인 상태: 로그인 버튼 숨기고 프로필 드롭다운 표시
            if (loginInfo) loginInfo.style.display = 'none';
            if (profileDropdown) profileDropdown.style.display = 'block';
            if (startButton) startButton.style.display = 'none';
            
            // 사용자 정보 업데이트
            const profileText = document.querySelector("#profile-dropdown .dropdown-toggle");
            const userEmailDisplay = document.querySelector("#profile-dropdown .text-muted");
            const profileMypageLink = document.querySelector("#profile-dropdown a[href*='mypage'], #profile-dropdown a[href*='admin']");
            
            if (profileText) {
                profileText.innerHTML = '<i class="fas fa-user me-2"></i>회원';
            }
            
            if (userEmailDisplay) {
                userEmailDisplay.textContent = session.user.email;
            }
            
            if (profileMypageLink) {
                profileMypageLink.href = "mypage.html";
                profileMypageLink.innerHTML = '<i class="fas fa-user me-2"></i>마이페이지';
            }
            
            // 전역 사용자 정보 설정
            window.currentUser = session.user;

        } else {
            // 로그아웃 상태 UI 업데이트
            console.log("❌ 로그아웃 상태");
            
            const loginInfo = document.getElementById("login-info");
            const profileDropdown = document.getElementById("profile-dropdown");
            const startButton = document.getElementById("start-button");
            
            // 로그아웃 상태: 로그인 버튼과 시작하기 버튼 표시, 프로필 드롭다운 숨김
            if (loginInfo) loginInfo.style.display = 'block';
            if (profileDropdown) profileDropdown.style.display = 'none';
            if (startButton) startButton.style.display = 'block';
            
            // 전역 사용자 정보 초기화
            window.currentUser = null;
        }
        
        // 인증 상태 변화 감지 (한 번만 설정)
        if (!window.authStateListenerSet) {
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log("인증 상태 변화:", event, session ? "로그인됨" : "로그아웃됨");
                
                if (event === "SIGNED_OUT") {
                    console.log("사용자 로그아웃 감지");
                    window.currentUser = null;
                    updateUIAccordingToAuthState();
                } else if (event === "SIGNED_IN" && session) {
                    console.log("사용자 로그인 감지:", session.user.email);
                    window.currentUser = session.user;
                    updateUIAccordingToAuthState();
                }
            });
            window.authStateListenerSet = true;
        }
        
    } catch (error) {
        console.error("❌ 인증 상태 확인 오류:", error);
        // 기본값: 로그아웃 상태로 설정
        const loginInfo = document.getElementById("login-info");
        if (loginInfo) {
            loginInfo.style.display = 'block';  // 로그인 버튼 표시
        }
        
        const profileDropdown = document.getElementById("profile-dropdown");
        if (profileDropdown) {
            profileDropdown.style.display = 'none';  // 프로필 드롭다운 숨김
        }
        
        const startButton = document.getElementById("start-button");
        if (startButton) {
            startButton.style.display = 'block';  // 시작하기 버튼 표시
        }
    }
}

// '내 콘텐츠' 모달을 표시하는 함수
async function showMyContent() {
    try {
        const {
            data: { user },
        } = await window.supabaseClient.auth.getUser();
        if (!user) {
            window.location.href = "auth.html";
            return;
        }

        // [핵심 수정] 'access_rights' -> 'purchases' 테이블로 수정
        const { data: purchases, error } = await window.supabaseClient
            .from("purchases")
            .select(
                `
                product_id,
                created_at,
                products ( id, name, type, image_url, price )
            `,
            )
            .eq("user_id", user.id);

        if (error) throw error;

        if (purchases.length === 0) {
            alert("구매한 콘텐츠가 없습니다.");
            return;
        }

        showMyContentModal(purchases);
    } catch (error) {
        console.error("내 콘텐츠 조회 오류:", error);
        alert("구매 내역을 불러오는 중 오류가 발생했습니다.");
    }
}

// 구매한 콘텐츠 모달을 생성하고 표시하는 함수
function showMyContentModal(purchases) {
    const modalHtml = `
        <div class="modal fade" id="myContentModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">내 콘텐츠</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row g-3">
                            ${purchases
                                .map((p) => {
                                    const product = p.products; // 관계형 데이터는 'products' 객체 안에 있습니다.
                                    if (!product) return ""; // 혹시 모를 오류 방지
                                    const typeText =
                                        product.type === "lecture"
                                            ? "강의"
                                            : "전자책";
                                    const badgeColor =
                                        product.type === "lecture"
                                            ? "primary"
                                            : "warning";
                                    const viewerUrl =
                                        product.type === "lecture"
                                            ? "video-viewer.html"
                                            : "ebook-viewer.html";

                                    return `
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <img src="${product.image_url || "https://placehold.co/600x400/eee/ccc?text=No+Image"}" 
                                             class="card-img-top" style="height: 150px; object-fit: cover;" alt="${product.name}">
                                        <div class="card-body d-flex flex-column">
                                            <span class="badge bg-${badgeColor} mb-2 align-self-start">${typeText}</span>
                                            <h6 class="card-title flex-grow-1">${product.name}</h6>
                                            <p class="text-muted small mb-2">
                                                구매일: ${new Date(p.created_at).toLocaleDateString("ko-KR")}
                                            </p>
                                            <a href="${viewerUrl}?id=${product.id}" class="btn btn-primary btn-sm w-100 mt-auto">
                                                <i class="fas fa-play me-2"></i>보기
                                            </a>
                                        </div>
                                    </div>
                                </div>`;
                                })
                                .join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    const existingModal = document.getElementById("myContentModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = new bootstrap.Modal(
        document.getElementById("myContentModal"),
    );
    modal.show();
    document
        .getElementById("myContentModal")
        .addEventListener("hidden.bs.modal", function () {
            this.remove();
        });
}

// ===================================================================================
//  상품 데이터 로딩 및 핸들러
// ===================================================================================

// 상품 로드와 클릭 핸들러 설정을 통합
async function loadProductsAndSetupHandlers() {
    try {
        await Promise.all([
            loadAndRenderSection("lecture", "lectures-container"),
            loadAndRenderSection("ebook", "ebooks-container"),
        ]);
        setupProductClickHandlers(); // 모든 상품이 렌더링 된 후 클릭 핸들러 설정
    } catch (error) {
        console.error("전체 상품 로드 중 오류:", error);
        showProductLoadError(document.getElementById("lectures-container"));
        showProductLoadError(document.getElementById("ebooks-container"));
    }
}

// 특정 타입의 상품을 로드하고 렌더링하는 범용 함수
async function loadAndRenderSection(type, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { data: products, error } = await window.supabaseClient
        .from("products")
        .select("id, name, description, price, image_url, type") // 필요한 컬럼만 명시
        .eq("type", type);

    if (error) {
        console.error(`${type} 로드 오류:`, error);
        showProductLoadError(container);
        throw error; // Promise.all이 오류를 감지하도록 에러를 다시 던짐
    }

    renderProducts(products, container, type);
}

// 상품 목록을 HTML로 렌더링
function renderProducts(products, container, type) {
    const typeText = type === "lecture" ? "강의" : "전자책";
    if (!products || products.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">등록된 ${typeText}가 없습니다</h5></div>`;
        return;
    }

    const productsHtml = products
        .map(
            (product) => `
        <div class="col-lg-4 col-md-6 mb-4 fade-in">
            <div class="product-card card h-100 shadow-sm">
                <img src="${product.image_url || "https://placehold.co/600x400/eee/ccc?text=No+Image"}" class="card-img-top" alt="${product.name}">
                <div class="card-body d-flex flex-column">
                    <span class="badge bg-${type === "lecture" ? "primary" : "warning"} mb-2 align-self-start">${typeText}</span>
                    <h5 class="card-title flex-grow-1">${product.name}</h5>
                    <p class="card-text small text-muted">${product.description || ""}</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="product-price fw-bold">₩${(product.price || 0).toLocaleString()}</span>
                        <!-- [핵심 개선] 버튼에 상품 ID와 타입을 모두 저장 -->
                        <button class="btn btn-primary btn-sm view-content-btn" data-product-id="${product.id}" data-product-type="${product.type}">
                            <i class="fas fa-${type === "lecture" ? "play" : "book"} me-1"></i>
                            상세 보기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
        )
        .join("");

    container.innerHTML = productsHtml;
}

// 상품 카드 버튼에 대한 클릭 이벤트 핸들러 설정 (이벤트 위임 사용)
function setupProductClickHandlers() {
    document.body.addEventListener("click", async function (e) {
        const button = e.target.closest(".view-content-btn");
        if (!button) return; // '보기' 버튼이 아니면 무시

        const productId = button.dataset.productId;
        const productType = button.dataset.productType;

        // [핵심 개선] 상세 페이지로 먼저 이동. 접근 제어는 상세 페이지에서.
        // 이렇게 하면 비로그인 사용자도 상품 상세 정보는 볼 수 있습니다.
        window.location.href = `product-detail.html?id=${productId}`;
    });
}

// ===================================================================================
//  UI/UX 및 기타 유틸리티 (기존 코드 유지 및 개선)
// ===================================================================================

// 등장 애니메이션 초기화
function initializeAnimations() {
    const elements = document.querySelectorAll(".fade-in");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add(
                    "animate__animated",
                    "animate__fadeInUp",
                );
                observer.unobserve(entry.target);
            }
        });
    });
    elements.forEach((el) => observer.observe(el));
}

// 스무스 스크롤 초기화
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    });
}

// 상품 로드 오류 표시
function showProductLoadError(container) {
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h5 class="text-muted">콘텐츠를 불러올 수 없습니다.</h5>
                <p class="text-muted">네트워크 연결을 확인하고 새로고침해 주세요.</p>
            </div>`;
    }
}

// 후기 데이터 로드 (현재는 정적 데이터 사용)
function loadReviews() {
    const container = document.getElementById("reviews-container");
    if (!container) return;
    const reviews = [
        {
            id: 1,
            author: "김○○",
            rating: 5,
            content:
                "강의 내용이 정말 알차고 이해하기 쉽게 설명해주셔서 많은 도움이 되었습니다.",
            date: "2025-01-15",
            product_title: "JavaScript 마스터클래스",
        },
        {
            id: 2,
            author: "이○○",
            rating: 5,
            content:
                "전자책의 구성이 체계적이고 실무에서 바로 적용할 수 있는 내용들이 많아서 좋았습니다.",
            date: "2025-01-10",
            product_title: "웹 개발 완벽 가이드",
        },
        {
            id: 3,
            author: "박○○",
            rating: 4,
            content:
                "초보자도 따라할 수 있게 친절하게 설명되어 있어서 만족합니다. 다음 강의도 기대됩니다.",
            date: "2025-01-05",
            product_title: "React 입문부터 실전까지",
        },
    ];
    renderReviews(reviews, container);
}

// 후기 렌더링
function renderReviews(reviews, container) {
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5"><h5 class="text-muted">등록된 후기가 없습니다</h5></div>`;
        return;
    }
    const reviewsHtml = reviews
        .map(
            (review) => `
        <div class="col-lg-4 col-md-6 mb-4 fade-in">
            <div class="review-card card h-100">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-2">
                        <div class="review-avatar">${review.author.charAt(0)}</div>
                        <div class="ms-2">
                            <div class="fw-bold">${review.author}</div>
                            <div class="text-muted small">${generateStars(review.rating)}</div>
                        </div>
                    </div>
                    <p class="review-content">"${review.content}"</p>
                    <small class="text-muted d-block text-end">- ${review.product_title}</small>
                </div>
            </div>
        </div>
    `,
        )
        .join("");
    container.innerHTML = reviewsHtml;
}

// 별점 생성
function generateStars(rating) {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
        if (i <= rating)
            starsHtml += '<i class="fas fa-star text-warning"></i>';
        else starsHtml += '<i class="far fa-star text-warning"></i>';
    }
    return starsHtml;
}

// 내비게이션 이벤트 설정
function setupNavigation() {
    window.addEventListener("scroll", function () {
        const navbar = document.querySelector(".navbar");
        if (navbar) {
            if (window.scrollY > 50) navbar.classList.add("navbar-scrolled");
            else navbar.classList.remove("navbar-scrolled");
        }
    });
}

// PWA 및 성능 최적화
function initializePerformanceOptimizations() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => console.log("서비스 워커 등록 성공:", reg))
            .catch((err) => console.log("서비스 워커 등록 실패:", err));
    }
}
