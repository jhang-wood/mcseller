// Modern MCSELLER Platform JavaScript
class ModernPlatform {
    constructor() {
        this.isInitialized = false;
        this.countdownTimer = null;
        this.animationCounters = new Map();
        this.observers = new Map();
    }

    // Initialize the platform
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.initializeCounters();
        this.startCountdownTimer();
        this.initializeCharts();
        this.loadCourses();
        this.loadFAQ();
        this.setupSmoothScrolling();
        this.setupNavbarEffects();
        this.initializeIntersectionObservers();
        
        this.isInitialized = true;
        console.log('🚀 MCSELLER Platform initialized successfully');
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', this.handleContactSubmission.bind(this));
        }

        // CTA button tracking
        document.querySelectorAll('.btn-premium').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.trackCTAClick(e.target);
            });
        });

        // Window scroll effects
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 16));
        
        // Window resize
        window.addEventListener('resize', this.throttle(this.handleResize.bind(this), 250));
    }

    // Animated Counters
    initializeCounters() {
        const counters = document.querySelectorAll('.counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.target);
            const increment = target / 100;
            
            this.animationCounters.set(counter, {
                target,
                current: 0,
                increment,
                isAnimating: false
            });
        });
    }

    animateCounter(counter) {
        const data = this.animationCounters.get(counter);
        if (!data || data.isAnimating) return;
        
        data.isAnimating = true;
        
        const animate = () => {
            data.current += data.increment;
            
            if (data.current >= data.target) {
                data.current = data.target;
                data.isAnimating = false;
            }
            
            // Format the number appropriately
            let displayValue = Math.floor(data.current);
            if (counter.textContent.includes('.')) {
                displayValue = (data.current).toFixed(1);
            }
            
            counter.textContent = displayValue;
            
            if (data.isAnimating) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // Countdown Timer
    startCountdownTimer() {
        const timerElement = document.getElementById('countdown-timer');
        if (!timerElement) return;

        // Set target time (24 hours from now)
        const targetTime = new Date().getTime() + (24 * 60 * 60 * 1000);
        
        this.countdownTimer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTime - now;
            
            if (distance < 0) {
                clearInterval(this.countdownTimer);
                timerElement.innerHTML = '<span class="text-warning">특가 종료!</span>';
                return;
            }
            
            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            timerElement.innerHTML = `
                <span class="hours">${hours.toString().padStart(2, '0')}</span>:
                <span class="minutes">${minutes.toString().padStart(2, '0')}</span>:
                <span class="seconds">${seconds.toString().padStart(2, '0')}</span>
            `;
        }, 1000);
    }

    // Charts
    initializeCharts() {
        this.createFailureChart();
    }

    createFailureChart() {
        const canvas = document.getElementById('failureChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['실패', '성공'],
                datasets: [{
                    data: [85, 15],
                    backgroundColor: ['#dc3545', '#ffd700'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                family: 'Noto Sans KR',
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.parsed}%`
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 0
                    }
                }
            }
        });
    }

    // Load Courses
    loadCourses() {
        const container = document.getElementById('courses-container');
        if (!container) return;

        const courses = [
            {
                id: 1,
                title: '중고 플랫폼 수익화 마스터',
                description: '당근마켓, 중고나라 등을 활용한 초보자도 쉽게 시작할 수 있는 수익화 전략',
                price: 89000,
                originalPrice: 150000,
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop',
                level: '초급',
                duration: '3시간',
                students: 1250
            },
            {
                id: 2,
                title: '스마트스토어 최적화 전략',
                description: '네이버 스마트스토어에서 월 300만원 이상 수익을 만드는 실전 노하우',
                price: 120000,
                originalPrice: 200000,
                image: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=250&fit=crop',
                level: '중급',
                duration: '5시간',
                students: 890
            },
            {
                id: 3,
                title: '온라인 마케팅 완전 정복',
                description: 'SNS, 블로그, 유튜브를 활용한 무료 마케팅으로 고객 확보하는 방법',
                price: 95000,
                originalPrice: 160000,
                image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop',
                level: '중급',
                duration: '4시간',
                students: 730
            }
        ];

        const coursesHTML = courses.map(course => `
            <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${course.id * 100}">
                <div class="solution-card course-card">
                    <div class="course-image">
                        <img src="${course.image}" alt="${course.title}" class="w-100" style="height: 200px; object-fit: cover; border-radius: 15px;">
                        <div class="course-badge">${course.level}</div>
                    </div>
                    <div class="course-content mt-3">
                        <h4>${course.title}</h4>
                        <p class="text-muted">${course.description}</p>
                        
                        <div class="course-meta mb-3">
                            <div class="meta-item">
                                <i class="fas fa-clock text-warning me-1"></i>
                                <small>${course.duration}</small>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-users text-warning me-1"></i>
                                <small>${course.students.toLocaleString()}명 수강</small>
                            </div>
                        </div>
                        
                        <div class="course-pricing mb-3">
                            <span class="original-price">₩${course.originalPrice.toLocaleString()}</span>
                            <span class="current-price">₩${course.price.toLocaleString()}</span>
                            <span class="discount-percent">${Math.round((1 - course.price/course.originalPrice) * 100)}% OFF</span>
                        </div>
                        
                        <a href="product-detail.html?id=${course.id}" class="btn btn-premium w-100">
                            <i class="fas fa-play me-2"></i>수강 신청하기
                        </a>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = coursesHTML;
    }

    // Load FAQ
    loadFAQ() {
        const container = document.querySelector('#faqAccordion');
        if (!container) return;

        const faqs = [
            {
                question: '정말 초보자도 2개월 내에 수익을 낼 수 있나요?',
                answer: '네, 가능합니다. MCSELLER의 체계적인 단계별 프로그램을 따라하시면 90% 이상의 수강생이 2개월 내에 첫 수익을 달성하고 있습니다. 중고 플랫폼 활용부터 시작하여 점진적으로 수익 규모를 확대하는 방식으로 진행됩니다.'
            },
            {
                question: '하루에 몇 시간 정도 투자해야 하나요?',
                answer: '하루 1-3시간 정도면 충분합니다. 처음에는 시스템을 익히는 데 시간이 더 필요하지만, 익숙해지면 하루 1시간 정도로도 안정적인 수익을 유지할 수 있습니다. 본업이 있는 직장인도 부담 없이 진행할 수 있는 수준입니다.'
            },
            {
                question: '초기 투자 비용이 많이 필요한가요?',
                answer: '아니요. 중고 플랫폼을 활용한 방법부터 시작하기 때문에 초기 투자 비용은 거의 들지 않습니다. 대부분 집에 있는 물건들을 활용하거나 10-20만원 정도의 소액으로 시작할 수 있습니다.'
            },
            {
                question: '정말 환불이 가능한가요?',
                answer: '네, 60일 내에 만족하지 않으시면 100% 전액 환불해드립니다. 단, 강의를 성실히 수강하고 실행했음에도 결과가 없는 경우에 한해 환불이 가능합니다. 실행하지 않고 환불을 요청하는 경우는 제외됩니다.'
            },
            {
                question: '1:1 멘토링은 어떻게 진행되나요?',
                answer: '월 2회, 총 6개월간 화상 또는 음성 통화로 진행됩니다. 개인별 진행 상황을 점검하고, 막히는 부분에 대한 구체적인 해결방안을 제시합니다. 필요시 추가 자료나 템플릿도 제공합니다.'
            }
        ];

        const faqHTML = faqs.map((faq, index) => `
            <div class="accordion-item">
                <h2 class="accordion-header" id="faq-heading-${index}">
                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                            data-bs-toggle="collapse" data-bs-target="#faq-collapse-${index}" 
                            aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="faq-collapse-${index}">
                        ${faq.question}
                    </button>
                </h2>
                <div id="faq-collapse-${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                     aria-labelledby="faq-heading-${index}" data-bs-parent="#faqAccordion">
                    <div class="accordion-body">
                        ${faq.answer}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = faqHTML;
    }

    // Contact Form Handler
    handleContactSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '전송 중...';
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            submitBtn.textContent = '전송 완료!';
            submitBtn.style.background = '#28a745';
            
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('contactModal')).hide();
                this.showToast('상담 신청이 완료되었습니다. 곧 연락드리겠습니다!', 'success');
                
                // Reset form
                e.target.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                submitBtn.style.background = '';
            }, 1500);
        }, 2000);
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        // Already handled in setupEventListeners
    }

    // Navbar Effects
    setupNavbarEffects() {
        const navbar = document.querySelector('.modern-navbar');
        if (!navbar) return;

        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                navbar.style.background = 'rgba(0,0,0,0.98)';
                navbar.style.borderBottomColor = 'rgba(255,215,0,0.3)';
            } else {
                navbar.style.background = 'rgba(0,0,0,0.95)';
                navbar.style.borderBottomColor = 'rgba(255,215,0,0.2)';
            }
            
            // Hide/show navbar on scroll
            if (scrollTop > lastScrollTop && scrollTop > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Intersection Observers
    initializeIntersectionObservers() {
        // Counter animation observer
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    this.animateCounter(counter);
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.counter').forEach(counter => {
            counterObserver.observe(counter);
        });

        // General animation observer
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.solution-card, .success-card, .benefit-point').forEach(el => {
            animationObserver.observe(el);
        });
    }

    // Scroll Handler
    handleScroll() {
        const scrollTop = window.pageYOffset;
        
        // Parallax effect for hero section
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const heroHeight = heroSection.offsetHeight;
            if (scrollTop < heroHeight) {
                const parallaxSpeed = scrollTop * 0.5;
                heroSection.style.transform = `translateY(${parallaxSpeed}px)`;
            }
        }
    }

    // Resize Handler
    handleResize() {
        // Recalculate any size-dependent elements
        if (window.innerWidth < 768) {
            // Mobile optimizations
            document.querySelectorAll('.floating-card').forEach(card => {
                card.style.display = 'none';
            });
        } else {
            document.querySelectorAll('.floating-card').forEach(card => {
                card.style.display = 'flex';
            });
        }
    }

    // CTA Click Tracking
    trackCTAClick(button) {
        const section = button.closest('section')?.id || 'unknown';
        console.log(`CTA clicked in section: ${section}`);
        
        // Add visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toastContainer = this.getOrCreateToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1100';
            document.body.appendChild(container);
        }
        return container;
    }

    // Utility Functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Public API
    destroy() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
        }
        
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.animationCounters.clear();
        
        this.isInitialized = false;
        console.log('🔄 MCSELLER Platform destroyed');
    }
}

// Global initialization
let modernPlatform;

function initializeModernPage() {
    if (!modernPlatform) {
        modernPlatform = new ModernPlatform();
    }
    modernPlatform.init();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeModernPage);
} else {
    initializeModernPage();
}

// Export for external use
window.ModernPlatform = ModernPlatform;
window.modernPlatform = modernPlatform;