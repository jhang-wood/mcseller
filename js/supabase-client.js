/**
 * MCSELLER 통합 Supabase 클라이언트
 * supabase-config.js의 중앙 설정을 사용합니다.
 */

// 전역 변수
let supabaseClient = null;

// Supabase 클라이언트 초기화 함수
async function initializeSupabaseClient() {
    try {
        console.log('🔄 Supabase 클라이언트 초기화 시작...');
        
        // 설정 파일이 로드되었는지 확인
        if (!window.SUPABASE_CONFIG) {
            console.error('❌ Supabase 설정이 로드되지 않았습니다.');
            throw new Error('Supabase configuration not loaded');
        }
        
        // 설정 검증
        if (!window.validateSupabaseConfig()) {
            throw new Error('Invalid Supabase configuration');
        }
        
        const config = window.SUPABASE_CONFIG;
        
        // Supabase 클라이언트 생성
        supabaseClient = supabase.createClient(config.url, config.anonKey, config.options);
        
        // 전역 변수로 설정
        window.supabaseClient = supabaseClient;
        
        console.log('✅ Supabase 클라이언트 초기화 완료');
        console.log('📍 프로젝트 URL:', config.url);
        console.log('🔑 Anon Key 길이:', config.anonKey.length);
        
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
서비스 연결에 문제가 발생했습니다.

가능한 원인:
1. Supabase Anon Key가 잘못되었거나 만료되었습니다.
2. 인터넷 연결에 문제가 있습니다.
3. Supabase 프로젝트가 일시적으로 중단되었습니다.

해결 방법:
1. js/supabase-config.js 파일의 anonKey를 Supabase 대시보드에서 복사한 값으로 교체하세요.
2. 페이지를 새로고침해보세요.
3. 문제가 지속되면 관리자에게 문의하세요.
        `;
        
        alert(userMessage.trim());
        throw error;
    }
}

// 전역 인증 상태 리스너
function setupGlobalAuthListener() {
    if (!window.supabaseClient) return;
    
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔄 전역 인증 상태 변화:', event);
        
        // 전역 이벤트 발생
        window.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { event, session }
        }));
        
        // 현재 사용자 정보 업데이트
        window.currentUser = session?.user || null;
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
 * 현재 세션 가져오기
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
        console.error('세션 가져오기 실패:', error);
        return null;
    }
}

/**
 * 구매 확인 함수
 */
async function checkPurchase(productId) {
    if (!window.supabaseClient) {
        console.error('구매 확인 실패: Supabase 클라이언트가 준비되지 않았습니다.');
        return false;
    }

    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const { data, error } = await window.supabaseClient
            .from('purchases')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('product_id', productId);

        if (error) throw error;
        return data.count > 0;
    } catch (err) {
        console.error('구매 확인 중 오류 발생:', err);
        return false;
    }
}

/**
 * 로그아웃 함수
 */
async function signOut() {
    if (!window.supabaseClient) {
        console.error('로그아웃 실패: Supabase 클라이언트가 준비되지 않았습니다.');
        return false;
    }
    
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        console.log('✅ 로그아웃 성공');
        return true;
    } catch (error) {
        console.error('로그아웃 실패:', error);
        return false;
    }
}

// 전역 함수 노출
window.getCurrentUser = getCurrentUser;
window.getSession = getSession;
window.checkPurchase = checkPurchase;
window.signOut = signOut;

// 자동 초기화 (DOMContentLoaded 대기)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabaseClient);
} else {
    // 이미 로드된 경우 즉시 실행
    initializeSupabaseClient();
}
