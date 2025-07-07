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
    
    const id = document.getElementById('loginId').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!id || !password) {
        showToast('아이디와 비밀번호를 입력해주세요.', 'warning');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>로그인 중...';
    submitBtn.disabled = true;
    
    try {
        console.log('🔄 로그인 시도:', id);
        
        // 입력된 값이 이메일 형식인지 확인
        const isEmail = id.includes('@');
        let email = id;
        
        if (!isEmail) {
            // 아이디로 입력된 경우, 일반적인 이메일 형식으로 변환 시도
            // 또는 직접 이메일 입력을 요구할 수 있습니다
            showToast('이메일 주소를 입력해주세요. (예: user@example.com)', 'warning');
            return;
        }
        
        // Supabase 인증으로 로그인 시도
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('로그인 오류:', error);
            
            if (error.message?.includes('Invalid login credentials')) {
                throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
            } else if (error.message?.includes('Email not confirmed')) {
                throw new Error('이메일 인증이 필요합니다. 이메일을 확인해주세요.');
            } else {
                throw new Error('로그인 중 오류가 발생했습니다: ' + error.message);
            }
        }
        
        if (data.user) {
            console.log('✅ 로그인 성공:', data.user.email);
            showToast('로그인 성공!', 'success');
            
            // 프로필 정보에서 관리자 권한 확인
            let isAdmin = false;
            try {
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                
                if (profile && profile.role === 'admin') {
                    isAdmin = true;
                    console.log('🔑 데이터베이스에서 관리자 권한 확인됨');
                }
            } catch (profileError) {
                console.log('⚠️ 프로필 조회 실패, 이메일 기반 권한 확인 시도');
                
                // 데이터베이스 확인 실패 시 이메일 기반 백업 체크
                const adminEmails = [
                    'admin@mcseller.co.kr',
                    'qwg18@naver.com',
                    'mcseller@gmail.com'
                ];
                
                isAdmin = adminEmails.includes(data.user.email);
                if (isAdmin) {
                    console.log('🔑 이메일 기반 관리자 권한 확인됨');
                }
            }
            
            setTimeout(() => {
                if (isAdmin) {
                    showToast('관리자 페이지로 이동합니다.', 'info');
                    setTimeout(() => {
                        window.location.href = '/admin.html';
                    }, 1500);
                } else {
                    showToast('마이페이지로 이동합니다.', 'info');
                    // 일반 사용자는 마이페이지 또는 리다이렉트 URL로 이동
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/mypage.html';
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1500);
                }
            }, 1000);
        }
    } catch (error) {
        console.error('로그인 처리 오류:', error);
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
    const id = document.getElementById('signupId').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (!name || !id || !email || !password || !confirmPassword) {
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
        console.log('🔄 회원가입 시도:', email);
        
        // Supabase 인증으로 회원가입
        const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    username: id
                }
            }
        });
        
        if (signUpError) {
            console.error('회원가입 오류:', signUpError);
            throw signUpError;
        }
        
        if (signUpData.user) {
            console.log('✅ 회원가입 성공:', signUpData.user.email);
            showToast('🎉 가입이 완료되었습니다!', 'success');
            
            // 이메일 확인이 필요한 경우
            if (!signUpData.session) {
                showToast('이메일 확인이 필요합니다. 이메일을 확인해주세요.', 'info');
                setTimeout(() => {
                    showLoginForm();
                }, 2000);
            } else {
                // 자동 로그인된 경우
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/mypage.html';
                    window.location.href = redirectUrl;
                }, 1500);
            }
        } else {
            throw new Error('회원가입에 실패했습니다.');
        }

    } catch (error) {
        console.error('회원가입 처리 오류:', error);
        
        let errorMessage = '회원가입 중 오류가 발생했습니다.';
        if (error.message) {
            if (error.message.includes('User already registered')) {
                errorMessage = '이미 가입된 이메일입니다.';
            } else if (error.message.includes('Password should be at least 6 characters')) {
                errorMessage = '비밀번호는 최소 6자 이상이어야 합니다.';
            } else if (error.message.includes('rate limit')) {
                errorMessage = '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
            } else if (error.message.includes('Invalid email')) {
                errorMessage = '올바른 이메일 형식을 입력해주세요.';
            } else {
                errorMessage = error.message;
            }
        }
        showToast(errorMessage, 'error');
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