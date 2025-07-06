// MCSELLER Mobile Utilities
class MobileUtils {
    constructor() {
        this.isTouch = this.detectTouch();
        this.deviceType = this.detectDevice();
        this.orientation = this.getOrientation();
        this.init();
    }

    init() {
        this.setupMobileOptimizations();
        this.setupTouchHandlers();
        this.setupOrientationChange();
        this.setupPullToRefresh();
        this.setupMobileNavigation();
        this.setupVibration();
    }

    // 터치 디바이스 감지
    detectTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // 기기 타입 감지
    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/iphone|ipod/.test(userAgent)) return 'iphone';
        if (/ipad/.test(userAgent)) return 'ipad';
        if (/android/.test(userAgent)) return 'android';
        if (/mobile/.test(userAgent)) return 'mobile';
        
        return 'desktop';
    }

    // 화면 방향 감지
    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    // 모바일 최적화 설정
    setupMobileOptimizations() {
        if (!this.isTouch) return;

        // viewport 설정 강화
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        }

        // iOS 상태 바 색상 설정
        if (this.deviceType === 'iphone' || this.deviceType === 'ipad') {
            const statusBarMeta = document.createElement('meta');
            statusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
            statusBarMeta.content = 'black-translucent';
            document.head.appendChild(statusBarMeta);
        }

        // 모바일 CSS 클래스 추가
        document.body.classList.add('mobile-device', `device-${this.deviceType}`);
        
        // 터치 이벤트 최적화
        document.body.style.touchAction = 'manipulation';
    }

    // 터치 핸들러 설정
    setupTouchHandlers() {
        if (!this.isTouch) return;

        // 터치 피드백
        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.btn, .card, .nav-link');
            if (target) {
                target.classList.add('touch-active');
                this.vibrate('light');
            }
        });

        document.addEventListener('touchend', (e) => {
            const target = e.target.closest('.btn, .card, .nav-link');
            if (target) {
                setTimeout(() => {
                    target.classList.remove('touch-active');
                }, 150);
            }
        });

        // 스와이프 제스처
        this.setupSwipeGestures();
    }

    // 스와이프 제스처 설정
    setupSwipeGestures() {
        let startX, startY, endX, endY;

        document.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
        });

        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;

            const touch = e.changedTouches[0];
            endX = touch.clientX;
            endY = touch.clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;
            const minSwipeDistance = 50;

            // 좌우 스와이프
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }

            // 상하 스와이프
            if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }

            startX = startY = endX = endY = null;
        });
    }

    // 스와이프 이벤트 핸들러
    handleSwipeRight() {
        // 뒤로 가기 (브라우저 히스토리)
        if (window.history.length > 1) {
            window.history.back();
        }
    }

    handleSwipeLeft() {
        // 사이드 메뉴 닫기
        const offcanvas = document.querySelector('.offcanvas.show');
        if (offcanvas) {
            bootstrap.Offcanvas.getInstance(offcanvas).hide();
        }
    }

    handleSwipeDown() {
        // 새로고침 (풀 투 리프레시)
        if (window.scrollY === 0) {
            this.pullToRefresh();
        }
    }

    handleSwipeUp() {
        // 상단으로 스크롤
        if (window.scrollY > 300) {
            this.scrollToTop();
        }
    }

    // 화면 방향 변경 처리
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.orientation = this.getOrientation();
                document.body.classList.remove('portrait', 'landscape');
                document.body.classList.add(this.orientation);
                
                // 뷰포트 높이 재계산
                this.updateViewportHeight();
                
                // 커스텀 이벤트 발생
                window.dispatchEvent(new CustomEvent('mobileOrientationChange', {
                    detail: { orientation: this.orientation }
                }));
            }, 100);
        });
    }

    // 뷰포트 높이 업데이트 (모바일 브라우저 주소창 대응)
    updateViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 진동 설정 초기화
    setupVibration() {
        this.vibrationSupport = 'vibrate' in navigator;
        console.log('진동 지원:', this.vibrationSupport);
    }

    // 진동 피드백
    vibrate(type = 'light') {
        if (!navigator.vibrate) return;

        const patterns = {
            light: 50,
            medium: 100,
            strong: [100, 30, 100],
            success: [50, 25, 50],
            error: [100, 50, 100, 50, 100]
        };

        navigator.vibrate(patterns[type] || patterns.light);
    }

    // 풀 투 리프레시
    setupPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let refreshThreshold = 80;
        let isRefreshing = false;

        const refreshIndicator = this.createRefreshIndicator();

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && !isRefreshing) {
                currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance > 0) {
                    e.preventDefault();
                    const progress = Math.min(pullDistance / refreshThreshold, 1);
                    this.updateRefreshIndicator(refreshIndicator, progress);
                }
            }
        });

        document.addEventListener('touchend', () => {
            if (window.scrollY === 0 && !isRefreshing) {
                const pullDistance = currentY - startY;
                
                if (pullDistance > refreshThreshold) {
                    this.triggerRefresh(refreshIndicator);
                } else {
                    this.hideRefreshIndicator(refreshIndicator);
                }
            }
        });
    }

    createRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-refresh-indicator';
        indicator.innerHTML = `
            <div class="refresh-spinner">
                <i class="fas fa-sync-alt"></i>
            </div>
            <div class="refresh-text">새로고침하려면 당기세요</div>
        `;
        
        indicator.style.cssText = `
            position: fixed;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            padding: 1rem;
            background: rgba(255, 153, 0, 0.9);
            border-radius: 0 0 20px 20px;
            color: white;
            text-align: center;
            transition: top 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(indicator);
        return indicator;
    }

    updateRefreshIndicator(indicator, progress) {
        const top = -100 + (progress * 120);
        indicator.style.top = `${top}px`;
        
        const spinner = indicator.querySelector('.refresh-spinner i');
        spinner.style.transform = `rotate(${progress * 360}deg)`;
        
        if (progress >= 1) {
            indicator.querySelector('.refresh-text').textContent = '놓아서 새로고침';
            this.vibrate('medium');
        } else {
            indicator.querySelector('.refresh-text').textContent = '새로고침하려면 당기세요';
        }
    }

    triggerRefresh(indicator) {
        indicator.style.top = '20px';
        indicator.querySelector('.refresh-text').textContent = '새로고침 중...';
        indicator.querySelector('.refresh-spinner i').style.animation = 'spin 1s linear infinite';
        
        this.vibrate('success');
        
        // 실제 새로고침 로직
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    hideRefreshIndicator(indicator) {
        indicator.style.top = '-100px';
    }

    pullToRefresh() {
        this.vibrate('medium');
        setTimeout(() => {
            window.location.reload();
        }, 500);
    }

    // 모바일 네비게이션 최적화
    setupMobileNavigation() {
        // 백 버튼 처리
        window.addEventListener('popstate', (e) => {
            // 커스텀 백 버튼 로직
            console.log('모바일 뒤로 가기');
        });

        // 더블 탭 줌 방지
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        });
    }

    // 부드러운 스크롤
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        this.vibrate('light');
    }

    // 모바일 키보드 대응
    setupKeyboardHandling() {
        const originalViewportHeight = window.innerHeight;

        window.addEventListener('resize', () => {
            const currentViewportHeight = window.innerHeight;
            const diff = originalViewportHeight - currentViewportHeight;

            if (diff > 150) { // 키보드가 올라온 것으로 판단
                document.body.classList.add('keyboard-open');
                this.handleKeyboardOpen();
            } else {
                document.body.classList.remove('keyboard-open');
                this.handleKeyboardClose();
            }
        });
    }

    handleKeyboardOpen() {
        // 키보드가 열렸을 때의 처리
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
            setTimeout(() => {
                activeElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        }
    }

    handleKeyboardClose() {
        // 키보드가 닫혔을 때의 처리
        this.updateViewportHeight();
    }

    // 앱 설치 상태 확인
    isAppInstalled() {
        return window.navigator.standalone || 
               window.matchMedia('(display-mode: standalone)').matches;
    }

    // 네트워크 상태 감지
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            this.showNetworkStatus('온라인 상태입니다', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNetworkStatus('오프라인 상태입니다', 'warning');
        });
    }

    showNetworkStatus(message, type) {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} mobile-toast`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            left: 20px;
            z-index: 1060;
            border-radius: 12px;
            text-align: center;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // 성능 최적화
    optimizeForMobile() {
        // 이미지 레이지 로딩
        const images = document.querySelectorAll('img[data-src]');
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

            images.forEach(img => imageObserver.observe(img));
        }

        // 스크롤 최적화
        let ticking = false;
        function updateScrollPosition() {
            // 스크롤 관련 업데이트
            ticking = false;
        }

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateScrollPosition);
                ticking = true;
            }
        });
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    window.mobileUtils = new MobileUtils();
    
    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .touch-active {
            transform: scale(0.95);
            opacity: 0.8;
        }
        
        .mobile-toast {
            animation: slideInDown 0.3s ease-out;
        }
        
        @keyframes slideInDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        
        .keyboard-open {
            padding-bottom: 0 !important;
        }
        
        :root {
            --vh: 1vh;
        }
        
        .full-height {
            height: calc(var(--vh, 1vh) * 100);
        }
    `;
    document.head.appendChild(style);
});