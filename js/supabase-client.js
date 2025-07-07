/**
 * MCSELLER 통합 Supabase 클라이언트
 * supabase-config.js의 중앙 설정을 사용합니다.
 */

// 전역 Supabase 클라이언트 변수
window.supabaseClient = null;
window.currentUser = null;

/**
 * Supabase 클라이언트 초기화
 */
async function initializeSupabaseClient() {
    try {
        console.log('🚀 Supabase 클라이언트 초기화 시작...');
        
        // 설정 파일 로드 대기
        let config = window.SUPABASE_CONFIG;
        let retryCount = 0;
        const maxRetries = 10;
        
        while (!config && retryCount < maxRetries) {
            console.log('⏳ Supabase 설정 로드 대기 중...', retryCount + 1);
            await new Promise(resolve => setTimeout(resolve, 500));
            config = window.SUPABASE_CONFIG;
            retryCount++;
        }
        
        if (!config) {
            throw new Error('Supabase 설정을 로드할 수 없습니다. js/supabase-config.js 파일을 확인하세요.');
        }
        
        // Supabase 클라이언트 생성 (향상된 설정)
        const supabaseClient = supabase.createClient(config.url, config.anonKey, {
            auth: {
                flowType: 'pkce',
                storage: window.localStorage,
                storageKey: 'mcseller.auth.token',
                persistSession: true,
                detectSessionInUrl: true,
                autoRefreshToken: true,
                debug: false
            },
            global: {
                headers: {
                    'apikey': config.anonKey,
                    'Authorization': `Bearer ${config.anonKey}`,
                    'X-Client-Info': 'mcseller-web@1.0.0'
                }
            },
            db: {
                schema: 'public'
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });
        
        // 전역 변수로 설정
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase 클라이언트 초기화 완료');
        console.log('📍 프로젝트 URL:', config.url);
        console.log('🔑 Anon Key 길이:', config.anonKey.length);
        
        // 초기 세션 확인 및 토큰 설정
        await setupInitialSession(supabaseClient);
        
        // 초기화 완료 이벤트 발생
        window.dispatchEvent(new Event('supabaseClientReady'));
        document.dispatchEvent(new Event('supabaseClientReady'));
        
        // 인증 상태 변화 리스너 설정
        setupGlobalAuthListener();
        
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        
        // 사용자에게 친화적인 오류 메시지
        const userMessage = `
🚨 서비스 연결에 문제가 발생했습니다.

가능한 원인:
1. Supabase Anon Key가 잘못되었거나 만료되었습니다.
2. 인터넷 연결에 문제가 있습니다.
3. Supabase 프로젝트가 일시적으로 중단되었습니다.

해결 방법:
1. js/supabase-config.js 파일의 anonKey를 Supabase 대시보드에서 복사한 값으로 교체하세요.
2. 페이지를 새로고침해보세요.
3. 문제가 지속되면 관리자에게 문의하세요.
        `;
        
        // 개발 환경에서만 알림 표시
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            alert(userMessage.trim());
        }
        throw error;
    }
}

// 초기 세션 설정
async function setupInitialSession(supabaseClient) {
    try {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        
        if (error) {
            console.error('초기 세션 로드 오류:', error);
            return;
        }
        
        if (session) {
            console.log('✅ 초기 세션 확인됨:', session.user.email);
            window.currentUser = session.user;
            
            // 인증 토큰을 헤더에 설정
            if (session.access_token) {
                // 전역 fetch 요청에 인증 토큰 자동 포함
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    const [url, options = {}] = args;
                    
                    // Supabase API 요청인 경우 토큰 추가
                    if (typeof url === 'string' && url.includes('supabase.co')) {
                        options.headers = {
                            ...options.headers,
                            'Authorization': `Bearer ${session.access_token}`,
                            'apikey': supabaseClient.supabaseKey
                        };
                    }
                    
                    return originalFetch.apply(this, [url, options]);
                };
                
                console.log('✅ 인증 토큰 자동 포함 설정 완료');
            }
        } else {
            console.log('ℹ️ 초기 세션 없음');
        }
    } catch (error) {
        console.error('초기 세션 설정 오류:', error);
    }
}

// 전역 인증 상태 리스너
function setupGlobalAuthListener() {
    if (!window.supabaseClient) return;
    
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 전역 인증 상태 변화:', event);
        
        // 현재 사용자 정보 업데이트
        window.currentUser = session?.user || null;
        
        // 세션이 변경될 때마다 토큰 업데이트
        if (session && session.access_token) {
            // 전역 fetch 요청에 인증 토큰 자동 포함
            const originalFetch = window.fetch;
            window.fetch = function(...args) {
                const [url, options = {}] = args;
                
                // Supabase API 요청인 경우 토큰 추가
                if (typeof url === 'string' && url.includes('supabase.co')) {
                    options.headers = {
                        ...options.headers,
                        'Authorization': `Bearer ${session.access_token}`,
                        'apikey': window.supabaseClient.supabaseKey
                    };
                }
                
                return originalFetch.apply(this, [url, options]);
            };
            
            console.log('✅ 인증 토큰 업데이트 완료');
        }
        
        // 전역 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { event, session }
        }));
    });
}

// 헬퍼 함수들

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
async function getCurrentUser() {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return null;
    }
    
    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        if (error) throw error;
        return user;
    } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
        return null;
    }
}

/**
 * 세션이 완전히 로드될 때까지 대기
 */
async function waitForSession(maxWaitTime = 10000) {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = 20;
    
    console.log('🔄 세션 로드 대기 시작... (최대', maxWaitTime/1000, '초)');
    
    while (Date.now() - startTime < maxWaitTime && retryCount < maxRetries) {
        try {
            // Supabase 클라이언트가 준비되었는지 확인
            if (!window.supabaseClient) {
                console.log('⏳ Supabase 클라이언트 대기 중...');
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
                continue;
            }
            
            // 세션 확인
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.warn('세션 확인 중 오류:', error.message);
                await new Promise(resolve => setTimeout(resolve, 500));
                retryCount++;
                continue;
            }
            
            if (session) {
                console.log('✅ 세션 로드 완료:', session.user.email);
                window.currentUser = session.user;
                return session;
            }
            
            // 세션이 없으면 계속 대기
            console.log('⏳ 세션 대기 중... (' + (retryCount + 1) + '/' + maxRetries + ')');
            await new Promise(resolve => setTimeout(resolve, 500));
            retryCount++;
            
        } catch (error) {
            console.warn('세션 대기 중 오류:', error.message);
            await new Promise(resolve => setTimeout(resolve, 1000));
            retryCount++;
        }
    }
    
    console.log('⚠️ 세션 로드 시간 초과 또는 최대 재시도 횟수 도달');
    return null;
}

/**
 * 현재 세션 상태 확인
 */
async function getSession() {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return null;
    }
    
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error('세션 확인 실패:', error);
        return null;
    }
}

/**
 * 사용자의 구매 내역 확인
 */
async function checkPurchase(productId) {
    const user = await getCurrentUser();
    if (!user) return false;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('purchases')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .eq('status', 'completed')
            .single();
            
        return !error && data;
    } catch (error) {
        console.error('구매 확인 실패:', error);
        return false;
    }
}

/**
 * 로그아웃 함수
 */
async function signOut() {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return false;
    }
    
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        window.currentUser = null;
        console.log('✅ 로그아웃 완료');
        return true;
    } catch (error) {
        console.error('로그아웃 실패:', error);
        return false;
    }
}

// 초기화 함수 자동 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM 로드 완료 - Supabase 클라이언트 초기화 예약');
    
    // 설정 파일이 로드될 때까지 대기 후 초기화
    if (window.SUPABASE_CONFIG) {
        initializeSupabaseClient();
    } else {
        // 설정 로드 이벤트 리스너
        document.addEventListener('supabaseConfigReady', function() {
            initializeSupabaseClient();
        });
        
        // 최대 5초 대기 후 강제 초기화 시도
        setTimeout(() => {
            if (!window.supabaseClient) {
                console.warn('⚠️ 설정 대기 시간 초과 - 강제 초기화 시도');
                initializeSupabaseClient();
            }
        }, 5000);
    }
});

console.log('📁 Supabase 클라이언트 파일 로드됨');
