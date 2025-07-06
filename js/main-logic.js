// MCSELLER Main Logic - 통합된 JavaScript 파일

// 전역 변수
let deferredPrompt; // PWA 설치 프롬프트

// Course landing data
const courseLandings = {
    lego: {
        title: "휴대폰 1개로 시작하는 레고리셀 치트키",
        subtitle: "완전 초보자도 1일 만에 수익 창출하는 가장 쉬운 시작",
        price: "79,000원부터",
        originalPrice: "190,000원",
        investment: "100만원 내외",
        features: [
            "107페이지 완전 실전 가이드북",
            "휴대폰만으로 바로 시작 가능",
            "평균 13일 내 첫 수익 달성",
            "비밀컬럼 열람권 + 매출관리 프로그램",
            "중고거래 매매계약서 템플릿",
            "실시간 업데이트 (평생 제공)",
            "1:1 온라인 컨설팅 (프리미엄 패키지)",
        ],
        reviews: [
            "정말 디테일하게 기술되어서 실행할 일만 남았어요!",
            "첫 달에 42만원, 다음 달 160만원까지 갔어요!",
            "이렇게까지 자세한 방법을 제시해주셔서 너무 감사해요",
            "컨설팅 시작하고 3분만에 3만원 수익 발생했습니다!",
        ],
        link: "https://kmong.com/self-marketing/504217/EnSc73Jiex",
    },
    luxury: {
        title: "1일만에 돌파하는 중고명품 창업사업",
        subtitle: "리셀의 정석! 월 200만원 이상을 목표로 하는 체계적인 명품리셀 전략",
        price: "99,000원부터",
        originalPrice: "290,000원",
        investment: "레고리셀보다 다소 필요 (개별 상담 안내)",
        features: [
            "120페이지 리셀의 정석 완전판",
            "12가지 카테고리 간편 분석법",
            "당근마켓 최신로직 치트키 완전 공개",
            "명품키워드 자료 + 자동화 매출관리 템플릿",
            "중고명품 VOD 강의 제공",
            "실시간 온라인 컨설팅 (약 2-3시간)",
            "1:1 개인별 맞춤 전략 수립",
        ],
        reviews: [
            "전자책에 선생님의 노하우가 쉽게 녹아있어서 바로 실행할 수 있는 점이 매력적이었습니다",
            "컨설팅 시작하고 3분만에 3만원 정도 수익이 발생했습니다!",
            "이런 강의는 처음 봤습니다. 실행만 하면 실패할 확률이 1%도 안 된다고 생각해요",
            "3시간 정도의 긴 컨설팅임에도 하나도 지치지 않으시고 계속 도움이 되는 이야기를 해주셔서 감사합니다",
        ],
        link: "https://kmong.com/self-marketing/431248/V8o7vCYANq",
    },
    ebook1: {
        title: "시 캐릭터로 월 1200만원 전자책 자동화 1탄",
        subtitle: "얼굴 노출 없이 블로그 중심의 전자책 자동화 수익 시스템",
        price: "99,000원 (슈퍼얼리버드)",
        originalPrice: "590,000원",
        investment: "목표 수익: 월 200만원 ~ 500만원",
        features: [
            "전자책 자동화 마스터 강의 (40만원 상당)",
            "소비자 심리해킹 전자책 (20만원 상당)",
            "마케팅 자동화 프로그램 영구버전 (70만원 상당)",
            "브랜딩블로그 제작법 (20만원 상당)",
            "맥셀러 협업 제안권 (100만원 상당)",
            "VIP 단톡방 이용권 (30만원 상당)",
            "1:1 QA 게시판 지원 (50만원 상당)",
        ],
        reviews: [
            "이 가격에 마케팅 자동화 프로그램까지 드리는 강의는 단언컨대 최초입니다",
            "강의 시장의 심각한 문제점들을 완벽하게 해결해주는 강의예요",
            "구체적인 방법과 확신이 있어 보여서 믿고 따라할 수 있었어요",
            "세세한 방법까지 무료강의에서도 알려주셔서 넘 감사합니다!",
        ],
        note: "2탄 진행을 위해서는 1탄 수강이 필수입니다",
        link: "ebook1-landing.html",
    },
    ebook2: {
        title: "전자책 자동화 마스터 2탄",
        subtitle: "자사몰 구축 + 퍼포먼스 광고로 진정한 자동화 수익 시스템 완성",
        price: "1탄 구매자만 특별가 제공",
        originalPrice: "별도 공개",
        investment: "1탄 수강 필수 조건",
        features: [
            "전자책 자동화 마스터 강의 2탄 (80만원 상당)",
            "나만의 마케팅 프로그램 만들기 (100만원 상당)",
            "자사몰 전자책 판매 사이트 생성법 (30만원 상당)",
            "픽셀 설치 완전 가이드 (50만원 상당)",
            "1.5배~3배 수익폭등 퍼포먼스광고 (50만원 상당)",
            "상세페이지 애니메이션 기능 추가",
            "총 380만원 상당의 자료 제공",
        ],
        reviews: [
            "수강생 6개월 평균 수익 2천만원을 달성한 진정한 디지털노마드로 성장했어요",
            "자동화 수익 X 3배 더 강력해진 고수익 비밀을 알게 되었습니다",
            "이 가격에 다시 보시기 힘드실 거예요. 정말 마지막 기회같아요",
            "7월 15일-20일 사이 자료 발송되는데 정말 기대됩니다",
        ],
        note: "1탄을 보시지 않으신 분은 2탄 내용을 절대 이해하실 수 없습니다. 반드시 1탄부터 시작해주세요.",
        link: "ebook2-landing.html",
    },
};

// 핵심 함수 정의
function updateNavigationUI(user) {
    console.log("네비게이션 UI 업데이트:", user ? "로그인됨" : "로그아웃됨");
    
    const loginInfo = document.getElementById('login-info');
    const profileDropdown = document.getElementById('profile-dropdown');
    const startButton = document.getElementById('start-button');
    
    if (user) {
        // 로그인 상태: 로그인 버튼 숨기고 프로필 드롭다운 표시
        if (loginInfo) loginInfo.style.display = 'none';
        if (profileDropdown) {
            profileDropdown.style.display = 'block';
            
            // 사용자 정보 업데이트
            const userEmailElement = profileDropdown.querySelector('.user-email');
            if (userEmailElement) {
                userEmailElement.textContent = user.email;
            }
        }
        if (startButton) startButton.style.display = 'none';
        
        console.log("✅ UI 업데이트 완료: 로그인 상태");
    } else {
        // 로그아웃 상태: 로그인 버튼 표시하고 프로필 드롭다운 숨기기
        if (loginInfo) loginInfo.style.display = 'block';
        if (profileDropdown) profileDropdown.style.display = 'none';
        if (startButton) startButton.style.display = 'block';
        
        console.log("✅ UI 업데이트 완료: 로그아웃 상태");
    }
}

function showToast(message, type = "info") {
    const alertClass =
        type === "success"
            ? "alert-success"
            : type === "error"
              ? "alert-danger"
              : "alert-info";

    const toastHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", toastHtml);

    setTimeout(() => {
        const alert = document.querySelector(".alert:last-of-type");
        if (alert) {
            alert.remove();
        }
    }, 3000);
}

function openCourseLanding(courseId) {
    const course = courseLandings[courseId];
    if (!course) return;

    const landingHTML = `
        <div class="landing-page" id="landing-${courseId}">
            <div class="landing-nav">
                <div class="container">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><rect width='200' height='60' fill='%23ff9900'/><text x='100' y='35' text-anchor='middle' dy='0.35em' font-size='24' fill='%23111' font-weight='bold'>MCSELLER</text></svg>" alt="MCSELLER" style="height:35px" class="me-2" />
                            <span class="trust-badge">K4 플랫폼 1위</span>
                        </div>
                        <button class="btn btn-outline-light btn-sm" onclick="closeLanding()">
                            <i class="fas fa-times me-2"></i>돌아가기
                        </button>
                    </div>
                </div>
            </div>

            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-8">
                        <!-- Header -->
                        <div class="product-header">
                            <div class="product-level-badge">${courseId === "lego" ? "★☆☆☆☆ 초급" : courseId === "luxury" ? "★★★☆☆ 중급" : courseId === "ebook1" ? "★★★★☆ 고급" : "★★★★★ 최상급"}</div>
                            <h1 class="product-title">${course.title}</h1>
                            <p class="product-subtitle">${course.subtitle}</p>
                        </div>

                        <!-- Price Section -->
                        <div class="product-price-section">
                            <div class="price-comparison">
                                ${course.originalPrice ? `<span class="old-price">${course.originalPrice}</span>` : ""}
                                <span class="new-price">${course.price}</span>
                                ${course.originalPrice ? '<span class="save-amount">특별가</span>' : ""}
                            </div>
                            <div class="course-investment mb-4">
                                <h6><i class="fas fa-info-circle me-2"></i>필요 조건</h6>
                                <p>${course.investment}</p>
                            </div>
                        </div>

                        <!-- Features & Reviews -->
                        <div class="row">
                            <div class="col-md-7">
                                <h5 class="text-white mb-3"><i class="fas fa-check-circle text-success me-2"></i>포함 내용</h5>
                                <ul class="list-unstyled">
                                    ${course.features
                                        .map(
                                            (feature) => `
                                        <li class="mb-2">
                                            <i class="fas fa-arrow-right text-warning me-2"></i>
                                            <span class="text-light">${feature}</span>
                                        </li>
                                    `
                                        )
                                        .join("")}
                                </ul>
                                ${
                                    course.note
                                        ? `
                                    <div class="warning-box mt-4">
                                        <i class="fas fa-exclamation-triangle me-2"></i>
                                        <strong>${course.note}</strong>
                                    </div>
                                `
                                        : ""
                                }
                            </div>
                            
                            <div class="col-md-5">
                                <h5 class="text-white mb-3"><i class="fas fa-star text-warning me-2"></i>실제 수강생 후기</h5>
                                <div class="review-carousel">
                                    ${course.reviews
                                        .map(
                                            (review) => `
                                        <div class="review-item">
                                            <div class="review-text">"${review}"</div>
                                            <div class="review-author">- 실제 수강생</div>
                                        </div>
                                    `
                                        )
                                        .join("")}
                                </div>
                            </div>
                        </div>

                        <!-- Guarantee -->
                        <div class="guarantee-box">
                            <i class="fas fa-shield-alt"></i>
                            <div>
                                <h6>추가 환불보증제도 60일 내 100% 조건부 환불보장</h6>
                                <p>만족하지 않으시면 조건 없이 전액 환불해드립니다</p>
                            </div>
                        </div>

                        <!-- CTA -->
                        <div class="text-center mt-4">
                            <a href="${course.link}" target="_blank" class="btn btn-premium btn-lg mb-3" style="width: 100%; max-width: 400px;">
                                <i class="fas fa-shopping-cart me-2"></i>K4에서 지금 바로 구매하기
                            </a>
                            <p class="text-muted small">
                                <i class="fas fa-external-link-alt me-1"></i>
                                안전한 K4 플랫폼으로 이동합니다
                            </p>
                        </div>

                        <!-- Cross-sell -->
                        <div class="text-center mt-4">
                            <small class="text-muted">다른 강의도 궁금하다면?</small><br>
                            <div class="mt-2">
                                ${courseId !== "lego" ? '<button class="btn btn-outline-light btn-sm me-2 mb-2" onclick="openCourseLanding(\'lego\')">레고리셀 (초급) 보기</button>' : ""}
                                ${courseId !== "luxury" ? '<button class="btn btn-outline-light btn-sm me-2 mb-2" onclick="openCourseLanding(\'luxury\')">명품리셀 (중급) 보기</button>' : ""}
                                ${courseId !== "ebook1" ? '<button class="btn btn-outline-light btn-sm me-2 mb-2" onclick="openCourseLanding(\'ebook1\')">전자책자동화 1탄 보기</button>' : ""}
                                ${courseId !== "ebook2" ? '<button class="btn btn-outline-light btn-sm mb-2" onclick="openCourseLanding(\'ebook2\')">전자책자동화 2탄 보기</button>' : ""}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById("courseLandings").innerHTML = landingHTML;
    document.getElementById("courseLandings").style.display = "block";
    document.body.style.overflow = "hidden";
}

function closeLanding() {
    document.getElementById("courseLandings").style.display = "none";
    document.body.style.overflow = "auto";
}

function handleAiMasterSignup() {
    // AI 마스터 과정 신청 처리
    showToast("무료 과정 신청이 완료되었습니다!", "success");
    
    setTimeout(() => {
        // 외부 URL로 리다이렉트 (실제 등록 페이지)
        window.open("https://forms.gle/example", "_blank");
    }, 1500);
}

async function checkLoginStatus() {
    try {
        if (!window.supabaseClient) {
            console.log("Supabase 클라이언트를 기다리는 중...");
            return false;
        }
        
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error("세션 확인 오류:", error);
            return false;
        }
        
        if (session && session.user) {
            console.log("✅ 로그인 상태 확인됨:", session.user.email);
            window.currentUser = session.user;
            updateNavigationUI(session.user);
            return session.user;
        } else {
            console.log("❌ 로그인되지 않음");
            updateNavigationUI(null);
            return false;
        }
    } catch (error) {
        console.error("로그인 상태 확인 중 오류:", error);
        updateNavigationUI(null);
        return false;
    }
}

// 로그아웃 기능
async function logout() {
    try {
        if (window.supabaseClient) {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) {
                console.error("로그아웃 오류:", error);
            }
        }
        
        // 로컬 상태 초기화
        window.currentUser = null;
        
        // UI 업데이트
        updateNavigationUI(null);
        
        // 토스트 메시지 표시
        showToast("로그아웃되었습니다.", "success");
        
        console.log("✅ 로그아웃 완료");
    } catch (error) {
        console.error("로그아웃 중 오류:", error);
        showToast("로그아웃 중 오류가 발생했습니다.", "error");
    }
}

// Supabase 인증 상태 변화 리스너 설정
function setupAuthStateListener() {
    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log("인증 상태 변화:", event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user) {
                window.currentUser = session.user;
                updateNavigationUI(session.user);
                showToast("로그인되었습니다.", "success");
            } else if (event === 'SIGNED_OUT') {
                window.currentUser = null;
                updateNavigationUI(null);
            }
        });
    }
}

// 단일 DOMContentLoaded 이벤트 리스너
document.addEventListener("DOMContentLoaded", function () {
    // AOS 초기화
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100,
    });

    // Achievement 값 보호 - 2천만원으로 고정
    setTimeout(() => {
        const achievementNumber = document.querySelector(
            '.achievement-number[data-fixed="true"]',
        );

        if (achievementNumber) {
            achievementNumber.textContent = "2천만원";
            achievementNumber.classList.remove("counter");

            // MutationObserver로 값 변경 감지하여 원복
            const observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (
                        mutation.target === achievementNumber &&
                        mutation.type === "childList"
                    ) {
                        achievementNumber.textContent = "2천만원";
                    }
                });
            });

            observer.observe(achievementNumber, {
                childList: true,
                subtree: true,
            });

            // 주기적으로 값 확인하여 원복
            setInterval(() => {
                if (achievementNumber.textContent !== "2천만원") {
                    achievementNumber.textContent = "2천만원";
                }
            }, 1000);
        }
    }, 100);

    // "지금 시작하기" 버튼들에 특별 처리
    document
        .querySelectorAll('a[href="#courses"]')
        .forEach((anchor) => {
            anchor.addEventListener("click", async function (e) {
                e.preventDefault();

                const isLoggedIn = await checkLoginStatus();

                if (isLoggedIn) {
                    // 로그인된 경우 courses 섹션으로 스크롤
                    const target = document.querySelector("#courses");
                    if (target) {
                        target.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }
                } else {
                    // 로그인되지 않은 경우 로그인 페이지로 이동
                    window.location.href = "auth.html";
                }
            });
        });

    // 다른 앵커 링크들에는 일반 부드러운 스크롤 적용
    document
        .querySelectorAll('a[href^="#"]:not([href="#courses"])')
        .forEach((anchor) => {
            anchor.addEventListener("click", function (e) {
                e.preventDefault();

                const target = document.querySelector(
                    this.getAttribute("href"),
                );

                if (target) {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            });
        });

    // 프로필 드롭다운 이벤트 리스너
    document.addEventListener("click", async function (e) {
        // 로그아웃 처리
        if (
            e.target.id === "profile-logout-link" ||
            e.target.closest("#profile-logout-link")
        ) {
            e.preventDefault();

            // 테스트 사용자 로그아웃
            if (localStorage.getItem("testUser")) {
                localStorage.removeItem("testUser");
                updateNavigationUI(null);
                showToast("로그아웃되었습니다.", "success");
                return;
            }

            // Supabase 로그아웃
            if (window.signOut) {
                const success = await window.signOut();
                if (success) {
                    updateNavigationUI(null);
                }
            }
        }

        // 마이페이지/관리자페이지 링크 처리
        if (
            e.target.id === "profile-mypage-link" ||
            e.target.closest("#profile-mypage-link")
        ) {
            e.preventDefault();

            const link = e.target.closest("#profile-mypage-link");
            if (link && link.href) {
                window.location.href = link.href;
            }
        }
    });

    console.log("MCSELLER 메인 로직 초기화 완료");
});

// AI Timer countdown
function updateAiCountdown() {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const timeLeft = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    // Update AI timer
    const aiTimer = document.getElementById("ai-countdown");
    if (aiTimer) {
        aiTimer.innerHTML = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    // Update other timer displays if they exist
    const timerElements = document.querySelectorAll(".timer");
    timerElements.forEach((timer) => {
        timer.innerHTML = `
            <span class="hours">${hours.toString().padStart(2, "0")}</span>:
            <span class="minutes">${minutes.toString().padStart(2, "0")}</span>:
            <span class="seconds">${seconds.toString().padStart(2, "0")}</span>
        `;
    });
}

// Update countdown every second
setInterval(updateAiCountdown, 1000);
updateAiCountdown(); // Initial call

// Service Worker 등록
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("/sw.js")
        .then(function (registration) {
            console.log("Service Worker 등록 성공:", registration.scope);
            
            // 업데이트 체크
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                newWorker.addEventListener("statechange", () => {
                    if (newWorker.state === "installed") {
                        if (navigator.serviceWorker.controller) {
                            console.log("새 콘텐츠를 사용할 수 있습니다.");
                            if (confirm("새 버전이 사용 가능합니다. 페이지를 새로고침하시겠습니까?")) {
                                window.location.reload();
                            }
                        } else {
                            console.log("오프라인 사용을 위해 콘텐츠가 캐시되었습니다.");
                        }
                    }
                });
            });
        })
        .catch(function (error) {
            console.log("Service Worker 등록 실패:", error);
        });
}

// PWA 설치 관련
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // PWA 설치 버튼 생성
    const installButton = document.createElement('button');
    installButton.innerHTML = `
        <i class="fas fa-download me-2"></i>
        앱으로 설치하기
    `;
    installButton.className = 'btn btn-primary position-fixed';
    installButton.style.cssText = `
        bottom: 20px; 
        right: 20px; 
        z-index: 1000; 
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        padding: 12px 20px;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA 설치:', outcome);
            deferredPrompt = null;
            installButton.remove();
        }
    });
    
    document.body.appendChild(installButton);
    
    // 5초 후 자동 숨김
    setTimeout(() => {
        if (installButton.parentNode) {
            installButton.style.opacity = '0.7';
        }
    }, 5000);
});

// 설치 완료 이벤트
window.addEventListener('appinstalled', () => {
    console.log('MCSELLER 앱이 설치되었습니다!');
    deferredPrompt = null;
});