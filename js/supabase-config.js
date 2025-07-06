/**
 * MCSELLER Supabase 중앙 설정 파일
 * 모든 Supabase 관련 설정을 이 파일에서 관리합니다.
 * 
 * ⚠️ 중요: Supabase 대시보드에서 정확한 값을 복사해서 붙여넣으세요.
 * Settings → API → Project API keys에서 확인 가능합니다.
 */

window.SUPABASE_CONFIG = {
    // Supabase 프로젝트 URL
    url: "https://rpcctgtmtplfahwtnglq.supabase.co",
    
    // Supabase Anon(공개) 키 - 대시보드에서 복사한 값으로 교체하세요
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss",
    
    // 클라이언트 설정
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: localStorage,
            storageKey: 'mcseller-auth',
            confirmEmail: false // 이메일 확인 비활성화
        },
        global: {
            headers: {
                'X-Client-Info': 'mcseller-production'
            }
        }
    }
};

// 설정 검증 함수
window.validateSupabaseConfig = function() {
    const config = window.SUPABASE_CONFIG;
    
    if (!config.url || config.url.includes('YOUR_') || config.url.includes('사용자')) {
        console.error('❌ Supabase URL이 설정되지 않았습니다.');
        return false;
    }
    
    if (!config.anonKey || config.anonKey.includes('YOUR_') || config.anonKey.includes('사용자')) {
        console.error('❌ Supabase Anon Key가 설정되지 않았습니다.');
        return false;
    }
    
    // JWT 토큰 검증
    try {
        const parts = config.anonKey.split('.');
        if (parts.length !== 3) {
            console.error('❌ 잘못된 Anon Key 형식입니다.');
            return false;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Date.now() / 1000;
        
        if (payload.exp && payload.exp < now) {
            console.error('❌ Anon Key가 만료되었습니다.');
            return false;
        }
        
        console.log('✅ Supabase 설정 검증 완료');
        return true;
    } catch (error) {
        console.error('❌ Anon Key 검증 실패:', error);
        return false;
    }
};

console.log('📋 Supabase 설정 파일 로드됨'); 