/**
 * MCSELLER 프로덕션 Supabase 클라이언트
 * 완전한 프로덕션 환경용으로 작성됨
 */

// Supabase 클라이언트 초기화 함수
async function initializeSupabaseClient() {
    // 환경 변수가 로드될 때까지 대기
    let retries = 0;
    const maxRetries = 10;
    
    while ((!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }
    
    const supabaseUrl = window.SUPABASE_URL;
    const supabaseAnonKey = window.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
        throw new Error('Supabase configuration missing');
    }
    
    try {
        // Supabase 클라이언트 생성
        const client = supabase.createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: localStorage,
                storageKey: 'mcseller-auth'
            },
            global: {
                headers: {
                    'X-Client-Info': 'mcseller-production'
                }
            }
        });
        
        // 전역 변수로 설정
        window.supabaseClient = client;
        
        console.log('✅ Supabase 클라이언트 초기화 완료');
        
        // 초기화 완료 이벤트 발생
        window.dispatchEvent(new Event('supabaseClientReady'));
        document.dispatchEvent(new Event('supabaseClientReady'));
        
        return client;
    } catch (error) {
        console.error('❌ Supabase 초기화 실패:', error);
        throw error;
    }
}

// 초기화 실행
initializeSupabaseClient().catch(err => {
    console.error('Supabase 초기화 중 오류:', err);
});