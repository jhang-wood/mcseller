// MCSELLER 인증 시스템 (프로덕션 준비 버전)

// 페이지 초기화
function initializeAuthPage() {
    setupFormEvents();
    checkExistingSession();
    setupFormSwitching();
    setupSocialAuth();
}

// 기존 세션 확인
async function checkExistingSession() {
    if (window.supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    }
}

// 폼 이벤트 설정
function setupFormEvents() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const resetForm = document.getElementById('resetForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }

    // 비밀번호 확인 검증
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }

    // 이메일 자동완성
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateEmail(this);
        });
    });

    // 비밀번호 강도 표시
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        if (input.id === 'signupPassword') {
            input.addEventListener('input', function() {
                showPasswordStrength(this);
            });
        }
    });
}

// 폼 전환 설정
function setupFormSwitching() {
    // 회원가입으로 전환
    document.querySelectorAll('[data-form="signup"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupForm();
        });
    });

    // 로그인으로 전환
    document.querySelectorAll('[data-form="login"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    });

    // 비밀번호 재설정으로 전환
    document.querySelectorAll('[data-form="reset"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showResetForm();
        });
    });
}

// 로그인 폼 표시
function showLoginForm() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('resetCard').style.display = 'none';
}

// 회원가입 폼 표시
function showSignupForm() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    document.getElementById('resetCard').style.display = 'none';
}

// 비밀번호 재설정 폼 표시
function showResetForm() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('resetCard').style.display = 'block';
}

// 로그인 처리 (프로덕션 버전)
async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email || !password) {
        showToast('이메일과 비밀번호를 입력해주세요.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
    submitBtn.disabled = true;

    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Supabase 로그인 오류:', error);
            if (error.message.includes('Invalid login credentials') || 
                error.message.includes('Invalid')) {
                showToast('아이디 또는 비밀번호가 일치하지 않습니다.', 'error');
            } else {
                showToast('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
            }
            return;
        }

        if (data.user) {
            if (rememberMe) {
                localStorage.setItem('rememberEmail', email);
            } else {
                localStorage.removeItem('rememberEmail');
            }

            showToast('성공적으로 로그인되었습니다!', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }

    } catch (error) {
        console.error('로그인 오류:', error);
        showToast('로그인 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 회원가입 처리 (프로덕션 버전)
async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    if (!name || !email || !password || !confirmPassword) {
        showToast('모든 필드를 입력해주세요.', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }

    if (!agreeTerms) {
        showToast('이용약관에 동의해주세요.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>가입 중...';
    submitBtn.disabled = true;

    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    created_at: new Date().toISOString()
                }
            }
        });

        if (error) {
            throw error;
        }

        if (data.user) {
            if (data.user.email_confirmed_at) {
                showToast('회원가입이 완료되었습니다!', 'success');
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
            } else {
                showToast('이메일 인증 링크를 확인해주세요.', 'info');
            }
        }

    } catch (error) {
        console.error('회원가입 오류:', error);
        if (error.message.includes('User already registered')) {
            showToast('이미 가입된 이메일입니다.', 'error');
        } else if (error.message.includes('Password')) {
            showToast('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
        } else {
            showToast('회원가입 중 오류가 발생했습니다.', 'error');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 비밀번호 재설정 처리
async function handlePasswordReset(e) {
    e.preventDefault();

    const email = document.getElementById('resetEmail').value.trim();

    if (!email) {
        showToast('이메일을 입력해주세요.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>전송 중...';
    submitBtn.disabled = true;

    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }

        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password.html`
        });

        if (error) {
            throw error;
        }

        showToast('비밀번호 재설정 링크가 이메일로 전송되었습니다.', 'success');

        setTimeout(() => {
            showLoginForm();
        }, 3000);

    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        showToast('비밀번호 재설정 중 오류가 발생했습니다.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 비밀번호 일치 검증
function validatePasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');

    if (confirmPassword && password !== confirmPassword) {
        confirmInput.classList.add('is-invalid');
        if (!confirmInput.nextElementSibling || 
            !confirmInput.nextElementSibling.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = '비밀번호가 일치하지 않습니다.';
            confirmInput.parentNode.appendChild(feedback);
        }
    } else {
        confirmInput.classList.remove('is-invalid');
        const feedback = confirmInput.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.remove();
        }
    }
}

// 소셜 로그인 설정
function setupSocialAuth() {
    // 카카오 로그인
    document.getElementById('kakao-login')?.addEventListener('click', handleKakaoLogin);
    document.getElementById('kakao-signup')?.addEventListener('click', handleKakaoLogin);
}

// 카카오 로그인 처리 (프로덕션)
async function handleKakaoLogin() {
    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/auth-callback.html`
            }
        });

        if (error) {
            throw error;
        }
    } catch (error) {
        console.error('카카오 로그인 오류:', error);
        showToast('카카오 로그인을 사용할 수 없습니다.', 'error');
    }
}

// 이메일 형식 검증
function validateEmail(input) {
    const email = input.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailPattern.test(email)) {
        showFieldError(input, '올바른 이메일 형식을 입력해주세요.');
    } else {
        removeFieldError(input);
    }
}

// 비밀번호 강도 표시
function showPasswordStrength(input) {
    const password = input.value;
    const strengthBar = createPasswordStrengthBar(input);
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const strengthTexts = ['매우 약함', '약함', '보통', '강함', '매우 강함'];
    const strengthColors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#20c997'];
    
    strengthBar.style.width = `${(strength / 5) * 100}%`;
    strengthBar.style.backgroundColor = strengthColors[strength - 1] || '#dee2e6';
    strengthBar.textContent = password ? strengthTexts[strength - 1] || '매우 약함' : '';
}

// 비밀번호 강도 바 생성
function createPasswordStrengthBar(input) {
    let strengthBar = input.parentNode.querySelector('.password-strength');
    if (!strengthBar) {
        strengthBar = document.createElement('div');
        strengthBar.className = 'password-strength mt-1 p-1 text-center small';
        strengthBar.style.height = '20px';
        strengthBar.style.borderRadius = '3px';
        strengthBar.style.transition = 'all 0.3s ease';
        input.parentNode.appendChild(strengthBar);
    }
    return strengthBar;
}

// 필드 오류 표시
function showFieldError(input, message) {
    input.classList.add('is-invalid');
    removeFieldError(input);
    
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    input.parentNode.appendChild(feedback);
}

// 필드 오류 제거
function removeFieldError(input) {
    input.classList.remove('is-invalid');
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// 토스트 컨테이너 생성
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('MCSELLER 인증 페이지가 로드되었습니다.');
    initializeAuthPage();
});