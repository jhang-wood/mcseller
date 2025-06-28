// 인증 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
    setupFormEvents();
    setupSocialAuth();
    checkExistingSession();
});

// 인증 페이지 초기화
function initializeAuthPage() {
    // URL 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    
    if (mode === 'signup') {
        showSignupForm();
    } else if (mode === 'reset') {
        showResetForm();
    } else {
        showLoginForm();
    }
    
    // 폼 전환 이벤트 설정
    setupFormSwitching();
}

// 기존 세션 확인
async function checkExistingSession() {
    if (!window.supabaseClient) return;
    
    try {
        const user = await getCurrentUser();
        if (user) {
            // 이미 로그인된 경우 메인 페이지로 리다이렉트
            const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
            window.location.href = returnUrl;
        }
    } catch (error) {
        console.error('세션 확인 오류:', error);
    }
}

// 폼 이벤트 설정
function setupFormEvents() {
    // 로그인 폼
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 회원가입 폼
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // 비밀번호 재설정 폼
    const resetForm = document.getElementById('resetForm');
    if (resetForm) {
        resetForm.addEventListener('submit', handlePasswordReset);
    }
    
    // 비밀번호 확인 검증
    const confirmPassword = document.getElementById('confirmPassword');
    const signupPassword = document.getElementById('signupPassword');
    
    if (confirmPassword && signupPassword) {
        confirmPassword.addEventListener('input', function() {
            validatePasswordMatch();
        });
        
        signupPassword.addEventListener('input', function() {
            validatePasswordMatch();
        });
    }
}

// 폼 전환 설정
function setupFormSwitching() {
    // 회원가입 표시
    document.getElementById('show-signup')?.addEventListener('click', function(e) {
        e.preventDefault();
        showSignupForm();
    });
    
    // 로그인 표시
    document.getElementById('show-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });
    
    // 비밀번호 재설정 표시
    document.getElementById('forgot-password')?.addEventListener('click', function(e) {
        e.preventDefault();
        showResetForm();
    });
    
    // 로그인으로 돌아가기
    document.getElementById('back-to-login')?.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });
}

// 로그인 폼 표시
function showLoginForm() {
    document.getElementById('login-form')?.classList.remove('d-none');
    document.getElementById('signup-form')?.classList.add('d-none');
    document.getElementById('reset-form')?.classList.add('d-none');
    
    // URL 업데이트
    const url = new URL(window.location);
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url);
}

// 회원가입 폼 표시
function showSignupForm() {
    document.getElementById('login-form')?.classList.add('d-none');
    document.getElementById('signup-form')?.classList.remove('d-none');
    document.getElementById('reset-form')?.classList.add('d-none');
    
    // URL 업데이트
    const url = new URL(window.location);
    url.searchParams.set('mode', 'signup');
    window.history.replaceState({}, '', url);
}

// 비밀번호 재설정 폼 표시
function showResetForm() {
    document.getElementById('login-form')?.classList.add('d-none');
    document.getElementById('signup-form')?.classList.add('d-none');
    document.getElementById('reset-form')?.classList.remove('d-none');
    
    // URL 업데이트
    const url = new URL(window.location);
    url.searchParams.set('mode', 'reset');
    window.history.replaceState({}, '', url);
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!email || !password) {
        showToast('이메일과 비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    // 로딩 상태 표시
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
            throw error;
        }
        
        if (data.user) {
            // 사용자 정보 저장 (remember me 옵션 적용)
            if (rememberMe) {
                localStorage.setItem('rememberUser', 'true');
            }
            
            showToast('성공적으로 로그인되었습니다!', 'success');
            
            // 리다이렉트
            setTimeout(() => {
                const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
                window.location.href = returnUrl;
            }, 1000);
        }
        
    } catch (error) {
        console.error('로그인 오류:', error);
        handleSupabaseError(error, '로그인');
    } finally {
        // 로딩 상태 해제
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 회원가입 처리
async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // 유효성 검사
    if (!name || !email || !password || !confirmPassword) {
        showToast('모든 필드를 입력해주세요.', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('비밀번호는 최소 6자 이상이어야 합니다.', 'warning');
        return;
    }
    
    if (!agreeTerms) {
        showToast('이용약관에 동의해주세요.', 'warning');
        return;
    }
    
    // 로딩 상태 표시
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>가입 중...';
    submitBtn.disabled = true;
    
    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }
        
        // Supabase 회원가입
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name
                }
            }
        });
        
        if (error) {
            throw error;
        }
        
        if (data.user) {
            // 사용자 정보를 users 테이블에 저장
            const { error: insertError } = await supabaseClient
                .from('users')
                .insert([
                    {
                        id: data.user.id,
                        email: email,
                        name: name,
                        role: 'user',
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (insertError) {
                console.error('사용자 정보 저장 오류:', insertError);
            }
            
            showToast('회원가입이 완료되었습니다! 이메일을 확인해주세요.', 'success');
            
            // 로그인 폼으로 전환
            setTimeout(() => {
                showLoginForm();
                document.getElementById('loginEmail').value = email;
            }, 2000);
        }
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        handleSupabaseError(error, '회원가입');
    } finally {
        // 로딩 상태 해제
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
    
    // 로딩 상태 표시
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
        
        // 로그인 폼으로 전환
        setTimeout(() => {
            showLoginForm();
        }, 3000);
        
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        handleSupabaseError(error, '비밀번호 재설정');
    } finally {
        // 로딩 상태 해제
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
        if (!confirmInput.nextElementSibling || !confirmInput.nextElementSibling.classList.contains('invalid-feedback')) {
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = '비밀번호가 일치하지 않습니다.';
            confirmInput.parentNode.appendChild(feedback);
        }
    } else {
        confirmInput.classList.remove('is-invalid');
        const feedback = confirmInput.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }
}

// 소셜 인증 설정
function setupSocialAuth() {
    // 카카오 로그인
    document.getElementById('kakao-login')?.addEventListener('click', handleKakaoLogin);
    document.getElementById('kakao-signup')?.addEventListener('click', handleKakaoLogin);
    
    // 구글 로그인
    document.getElementById('google-login')?.addEventListener('click', handleGoogleLogin);
    document.getElementById('google-signup')?.addEventListener('click', handleGoogleLogin);
}

// 카카오 로그인 처리
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

// 구글 로그인 처리
async function handleGoogleLogin() {
    try {
        if (!window.supabaseClient) {
            throw new Error('서비스 연결 오류');
        }
        
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth-callback.html`
            }
        });
        
        if (error) {
            throw error;
        }
        
    } catch (error) {
        console.error('구글 로그인 오류:', error);
        showToast('구글 로그인을 사용할 수 없습니다.', 'error');
    }
}

// 입력 필드 이벤트 처리
document.addEventListener('DOMContentLoaded', function() {
    // 이메일 형식 검증
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
});

// 이메일 유효성 검사
function validateEmail(input) {
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        input.classList.add('is-invalid');
        showFieldError(input, '유효한 이메일 주소를 입력해주세요.');
    } else {
        input.classList.remove('is-invalid');
        removeFieldError(input);
    }
}

// 비밀번호 강도 표시
function showPasswordStrength(input) {
    const password = input.value;
    let strength = 0;
    let message = '';
    
    if (password.length >= 6) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    removeFieldError(input);
    
    const strengthBar = input.parentNode.querySelector('.password-strength') || 
                       createPasswordStrengthBar(input);
    
    switch (strength) {
        case 0:
        case 1:
            strengthBar.className = 'password-strength weak';
            message = '약함';
            break;
        case 2:
        case 3:
            strengthBar.className = 'password-strength medium';
            message = '보통';
            break;
        case 4:
        case 5:
            strengthBar.className = 'password-strength strong';
            message = '강함';
            break;
    }
    
    strengthBar.querySelector('.strength-text').textContent = message;
}

// 비밀번호 강도 바 생성
function createPasswordStrengthBar(input) {
    const strengthBar = document.createElement('div');
    strengthBar.className = 'password-strength';
    strengthBar.innerHTML = `
        <div class="strength-bar"></div>
        <small class="strength-text"></small>
    `;
    
    input.parentNode.appendChild(strengthBar);
    return strengthBar;
}

// 필드 오류 표시
function showFieldError(input, message) {
    removeFieldError(input);
    
    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback';
    feedback.textContent = message;
    input.parentNode.appendChild(feedback);
}

// 필드 오류 제거
function removeFieldError(input) {
    const feedback = input.parentNode.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

// 키보드 이벤트 처리
document.addEventListener('keydown', function(e) {
    // Enter 키로 다음 필드로 이동
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        
        const form = e.target.closest('form');
        const inputs = form.querySelectorAll('input, button');
        const currentIndex = Array.from(inputs).indexOf(e.target);
        const nextInput = inputs[currentIndex + 1];
        
        if (nextInput) {
            if (nextInput.tagName === 'BUTTON') {
                nextInput.click();
            } else {
                nextInput.focus();
            }
        }
    }
});

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .password-strength {
        margin-top: 0.5rem;
    }
    
    .strength-bar {
        height: 4px;
        border-radius: 2px;
        background-color: #dee2e6;
        margin-bottom: 0.25rem;
        transition: all 0.3s ease;
    }
    
    .password-strength.weak .strength-bar {
        background-color: #dc3545;
        width: 33%;
    }
    
    .password-strength.medium .strength-bar {
        background-color: #ffc107;
        width: 66%;
    }
    
    .password-strength.strong .strength-bar {
        background-color: #198754;
        width: 100%;
    }
    
    .strength-text {
        font-size: 0.75rem;
        color: #6c757d;
    }
`;
document.head.appendChild(style);
