// Supabase 클라이언트 초기화 및 설정
let supabaseClient;

// 플랫폼 설정에서 Supabase 설정 가져오기
function getSupabaseConfig() {
    // 실제 프로덕션에서는 서버에서 제공하는 환경변수 사용
    // 현재는 데모용 설정 사용
    return {
        url: window.SUPABASE_CONFIG?.supabaseUrl || 'https://demo-project.supabase.co',
        anonKey: window.SUPABASE_CONFIG?.supabaseAnonKey || 'demo-anon-key'
    };
}

// Supabase 클라이언트 초기화
function initializeSupabase() {
    try {
        // 개발 환경에서는 테스트 모드로 작동
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('replit')) {
            console.log('개발 모드: 테스트 사용자로 초기화됩니다.');
            setupTestMode();
            return;
        }
        
        if (typeof supabase !== 'undefined') {
            const config = getSupabaseConfig();
            supabaseClient = supabase.createClient(config.url, config.anonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            });
            
            console.log('Supabase 클라이언트가 초기화되었습니다.');
            
            // 인증 상태 변경 리스너 설정
            supabaseClient.auth.onAuthStateChange((event, session) => {
                handleAuthStateChange(event, session);
            });
            
            return supabaseClient;
        } else {
            console.error('Supabase 라이브러리가 로드되지 않았습니다.');
            return null;
        }
    } catch (error) {
        console.error('Supabase 초기화 오류:', error);
        return null;
    }
}

// 인증 상태 변경 핸들러
function handleAuthStateChange(event, session) {
    console.log('인증 상태 변경:', event, session);
    
    switch (event) {
        case 'INITIAL_SESSION':
            // 초기 세션 상태 확인 (AuthSessionMissingError 방지)
            if (session) {
                updateUIForSignedInUser(session.user);
            } else {
                updateUIForSignedOutUser();
            }
            break;
        case 'SIGNED_IN':
            updateUIForSignedInUser(session.user);
            break;
        case 'SIGNED_OUT':
            updateUIForSignedOutUser();
            break;
        case 'TOKEN_REFRESHED':
            console.log('토큰이 갱신되었습니다.');
            break;
        case 'USER_UPDATED':
            updateUIForSignedInUser(session.user);
            break;
    }
}

// 로그인된 사용자 UI 업데이트
function updateUIForSignedInUser(user) {
    const loginNav = document.getElementById('login-nav');
    const userNav = document.getElementById('user-nav');
    const userName = document.getElementById('user-name');
    const adminLink = document.getElementById('admin-link');
    
    if (loginNav) loginNav.classList.add('d-none');
    if (userNav) userNav.classList.remove('d-none');
    if (userName) userName.textContent = user.email;
    
    // 관리자 권한 확인
    checkAdminRole(user.id).then(isAdmin => {
        if (adminLink) {
            adminLink.style.display = isAdmin ? 'block' : 'none';
        }
    });
}

// 로그아웃된 사용자 UI 업데이트
function updateUIForSignedOutUser() {
    const loginNav = document.getElementById('login-nav');
    const userNav = document.getElementById('user-nav');
    
    if (loginNav) loginNav.classList.remove('d-none');
    if (userNav) userNav.classList.add('d-none');
}

// 관리자 권한 확인
async function checkAdminRole(userId) {
    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.error('관리자 권한 확인 오류:', error);
            return false;
        }
        
        return data?.role === 'admin';
    } catch (error) {
        console.error('관리자 권한 확인 중 오류:', error);
        return false;
    }
}

// 사용자 인증 확인
async function getCurrentUser() {
    // 개발 환경에서는 테스트 사용자만 확인
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('replit')) {
        const testUser = localStorage.getItem('testUser');
        return testUser ? JSON.parse(testUser) : null;
    }
    
    // 테스트 사용자 확인
    const testUser = localStorage.getItem('testUser');
    if (testUser) {
        return JSON.parse(testUser);
    }
    
    try {
        if (!supabaseClient || !supabaseClient.auth) {
            return null;
        }
        
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('사용자 인증 확인 오류:', error);
        return null;
    }
}

// 로그아웃
async function signOut() {
    // 테스트 사용자 로그아웃
    if (localStorage.getItem('testUser')) {
        localStorage.removeItem('testUser');
        showToast('성공적으로 로그아웃되었습니다.', 'success');
        return true;
    }
    
    try {
        const { error } = await supabaseClient.auth.signOut();
        
        if (error) {
            console.error('로그아웃 오류:', error);
            showToast('로그아웃 중 오류가 발생했습니다.', 'error');
            return false;
        }
        
        showToast('성공적으로 로그아웃되었습니다.', 'success');
        return true;
    } catch (error) {
        console.error('로그아웃 처리 오류:', error);
        showToast('로그아웃 중 오류가 발생했습니다.', 'error');
        return false;
    }
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    const toastId = 'toast-' + Date.now();
    const toastHtml = `
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="fas fa-${getToastIcon(type)} me-2 text-${getToastColor(type)}"></i>
                <strong class="me-auto">알림</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // 토스트가 숨겨진 후 DOM에서 제거
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// 토스트 아이콘 반환
function getToastIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-triangle';
        case 'warning': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

// 토스트 색상 반환
function getToastColor(type) {
    switch (type) {
        case 'success': return 'success';
        case 'error': return 'danger';
        case 'warning': return 'warning';
        default: return 'primary';
    }
}

// 오류 처리 유틸리티
function handleSupabaseError(error, context = '') {
    console.error(`Supabase 오류 (${context}):`, error);
    
    let message = '알 수 없는 오류가 발생했습니다.';
    
    if (error.message) {
        // 일반적인 Supabase 오류 메시지를 한국어로 변환
        switch (error.message) {
            case 'Invalid login credentials':
                message = '이메일 또는 비밀번호가 올바르지 않습니다.';
                break;
            case 'Email not confirmed':
                message = '이메일 인증이 완료되지 않았습니다.';
                break;
            case 'User already registered':
                message = '이미 가입된 이메일입니다.';
                break;
            case 'Password should be at least 6 characters':
                message = '비밀번호는 최소 6자 이상이어야 합니다.';
                break;
            default:
                message = error.message;
        }
    }
    
    showToast(message, 'error');
    return message;
}

// 페이지 로드 시 Supabase 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 개발 환경 확인
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' || 
                         window.location.hostname.includes('replit');
    
    if (isDevelopment) {
        console.log('개발 환경에서 실행 중입니다.');
        setupTestMode();
    } else {
        supabaseClient = initializeSupabase();
        
        if (!supabaseClient) {
            console.error('Supabase 클라이언트 초기화에 실패했습니다.');
            showToast('서비스 연결에 문제가 있습니다. 페이지를 새로고침해 주세요.', 'error');
        }
    }
    
    // 현재 사용자 상태 확인 (onAuthStateChange로 대체)
    if (isDevelopment) {
        // 개발 환경에서는 직접 확인
        getCurrentUser().then(user => {
            if (user) {
                updateUIForSignedInUser(user);
            } else {
                updateUIForSignedOutUser();
            }
        }).catch(error => {
            console.log('사용자 상태 확인 중 오류:', error);
            updateUIForSignedOutUser();
        });
    }
    // 프로덕션 환경에서는 onAuthStateChange가 자동으로 처리
    
    // 로그아웃 버튼 이벤트 리스너
    const logoutBtns = document.querySelectorAll('#logout-btn, #admin-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const success = await signOut();
            if (success) {
                window.location.href = 'index.html';
            }
        });
    });
});

// 개발 모드용 테스트 설정
function setupTestMode() {
    // 로컬 스토리지에서 테스트 사용자 정보 가져오기
    const testUser = localStorage.getItem('testUser');
    
    if (testUser) {
        const user = JSON.parse(testUser);
        console.log('테스트 사용자 발견:', user);
        updateUIForSignedInUser(user);
    } else {
        console.log('테스트 모드: 로그아웃 상태');
        updateUIForSignedOutUser();
    }
    
    // 가짜 Supabase 객체 생성 (오류 방지)
    supabaseClient = {
        auth: {
            getUser: () => Promise.resolve({ data: { user: testUser ? JSON.parse(testUser) : null }, error: null }),
            signUp: (credentials) => {
                console.log('테스트 모드: 회원가입 시뮬레이션');
                const user = { email: credentials.email, id: 'test-user-id' };
                localStorage.setItem('testUser', JSON.stringify(user));
                updateUIForSignedInUser(user);
                return Promise.resolve({ data: { user }, error: null });
            },
            signInWithPassword: (credentials) => {
                console.log('테스트 모드: 로그인 시뮬레이션');
                const user = { email: credentials.email, id: 'test-user-id' };
                localStorage.setItem('testUser', JSON.stringify(user));
                updateUIForSignedInUser(user);
                return Promise.resolve({ data: { user }, error: null });
            },
            signOut: () => {
                console.log('테스트 모드: 로그아웃 시뮬레이션');
                localStorage.removeItem('testUser');
                updateUIForSignedOutUser();
                return Promise.resolve({ error: null });
            }
        }
    };
}

// 전역 객체로 내보내기
window.supabaseClient = supabaseClient;
window.getCurrentUser = getCurrentUser;
window.signOut = signOut;
window.showToast = showToast;
window.handleSupabaseError = handleSupabaseError;
window.setupTestMode = setupTestMode;
