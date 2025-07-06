/**
 * MCSELLER 프로덕션 인증 시스템
 * 순수 Supabase 인증만 사용
 */

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthPage();
});

// 인증 페이지 초기화
async function initializeAuthPage() {
    // Supabase 클라이언트 대기
    if (!window.supabaseClient) {
        await new Promise(resolve => {
            window.addEventListener('supabaseClientReady', resolve, { once: true });
        });
    }
    
    setupFormEvents();
    setupFormSwitching();
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
}

// 폼 전환 설정
function setupFormSwitching() {
    const showSignupLink = document.getElementById('showSignupForm');
    const showLoginLink = document.getElementById('showLoginForm');
    const showResetLink = document.getElementById('showResetForm');
    const backToLoginLink = document.getElementById('backToLogin');
    
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignupForm();
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    if (showResetLink) {
        showResetLink.addEventListener('click', (e) => {
            e.preventDefault();
            showResetForm();
        });
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginForm();
        });
    }
}

// 폼 표시 함수들
function showLoginForm() {
    document.getElementById('loginCard').classList.remove('d-none');
    document.getElementById('signupCard').classList.add('d-none');
    document.getElementById('resetCard').classList.add('d-none');
}

function showSignupForm() {
    document.getElementById('loginCard').classList.add('d-none');
    document.getElementById('signupCard').classList.remove('d-none');
    document.getElementById('resetCard').classList.add('d-none');
}

function showResetForm() {
    document.getElementById('loginCard').classList.add('d-none');
    document.getElementById('signupCard').classList.add('d-none');
    document.getElementById('resetCard').classList.remove('d-none');
}

// 로그인 처리
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('이메일과 비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        if (data.user) {
            showToast('로그인 성공!', 'success');
            
            // 로그인 성공 후 메인 페이지로 이동
            setTimeout(() => {
                // URL에 리다이렉트 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로
                const urlParams = new URLSearchParams(window.location.search);
                const redirectTo = urlParams.get('redirect') || '/index.html';
                window.location.href = redirectTo;
            }, 1000);
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        
        showToast(error.message || '로그인 중 오류가 발생했습니다.', 'error');
    } finally {
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
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                },
                emailRedirectTo: undefined,
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            // 이메일 확인 없이 바로 로그인
            showToast('🎉 가입 성공! 로그인 중...', 'success');
            setTimeout(() => {
                // URL에 리다이렉트 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로
                const urlParams = new URLSearchParams(window.location.search);
                const redirectTo = urlParams.get('redirect') || '/index.html';
                window.location.href = redirectTo;
            }, 1000);
        }
    } catch (error) {
        console.error('회원가입 오류:', error);
        
        // 다양한 회원가입 오류 처리
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
            showToast('이미 가입된 이메일입니다. 로그인을 시도해주세요.', 'warning');
            setTimeout(() => {
                showLoginForm();
            }, 2000);
        } else if (error.message?.includes('invalid email')) {
            showToast('올바른 이메일 형식을 입력해주세요.', 'warning');
        } else if (error.message?.includes('weak password') || error.message?.includes('Password')) {
            showToast('비밀번호는 최소 6자 이상이어야 합니다.', 'warning');
        } else if (error.message?.includes('rate limit')) {
            showToast('너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.', 'warning');
        } else {
            showToast(error.message || '회원가입 중 오류가 발생했습니다.', 'error');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 비밀번호 재설정
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
        const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth.html'
        });
        
        if (error) throw error;
        
        showToast('비밀번호 재설정 링크를 이메일로 전송했습니다.', 'success');
        setTimeout(() => {
            showLoginForm();
        }, 2000);
    } catch (error) {
        console.error('비밀번호 재설정 오류:', error);
        
        // 비밀번호 재설정 오류 처리
        if (error.message?.includes('invalid email')) {
            showToast('올바른 이메일 형식을 입력해주세요.', 'warning');
        } else if (error.message?.includes('not found') || error.message?.includes('user not found')) {
            showToast('등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.', 'warning');
            setTimeout(() => {
                showSignupForm();
            }, 2000);
        } else if (error.message?.includes('rate limit')) {
            showToast('너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.', 'warning');
        } else {
            showToast(error.message || '비밀번호 재설정 중 오류가 발생했습니다.', 'error');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// 토스트 컨테이너 생성
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = '11';
    document.body.appendChild(container);
    return container;
}