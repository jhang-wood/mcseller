/**
 * MCSELLER 프로덕션 Supabase 클라이언트
 * 완전한 프로덕션 환경용으로 작성됨
 */

// Supabase 클라이언트 초기화 함수
async function initializeSupabaseClient() {
    // ⚠️ 사용자가 제공한 실제 Supabase 프로젝트 정보로 교체하세요
    const SUPABASE_URL = "https://rpcctgtmtplfahwtnglq.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss";
    
    const supabaseUrl = SUPABASE_URL;
    const supabaseAnonKey = SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("사용자에게_받은") || supabaseAnonKey.includes("사용자에게_받은")) {
        console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
        console.error('위 파일에서 SUPABASE_URL과 SUPABASE_ANON_KEY를 실제 값으로 교체해주세요.');
        throw new Error('Supabase configuration missing - Please update the actual values');
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