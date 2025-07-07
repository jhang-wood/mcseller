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
    
    // 2025년 1월 업데이트된 Anon Key (만료 시간: 2066년)
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss",
    
    // 데이터베이스 설정
    schema: "public",
    
    // 인증 설정
    auth: {
        persistSession: true,
        storageKey: "supabase.auth.token",
        storage: "localStorage",
        flowType: "pkce",
        autoRefreshToken: true,
        detectSessionInUrl: true,
        debug: false
    },
    
    // 실시간 설정
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    },
    
    // 글로벌 헤더 설정
    global: {
        headers: {
            'X-Client-Info': 'mcseller-web@1.0.0'
        }
    }
};

// 설정 검증 함수
function validateSupabaseConfig() {
    const config = window.SUPABASE_CONFIG;
    
    if (!config || !config.url || !config.anonKey) {
        console.error("❌ Supabase 설정이 올바르지 않습니다:");
        console.error("- URL:", config?.url);
        console.error("- AnonKey 길이:", config?.anonKey?.length);
        return false;
    }
    
    // JWT 토큰 형식 검증
    const parts = config.anonKey.split('.');
    if (parts.length !== 3) {
        console.error("❌ Anon Key가 올바른 JWT 형식이 아닙니다");
        return false;
    }
    
    try {
        // JWT 페이로드 디코딩
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp < now) {
            console.error("❌ Anon Key가 만료되었습니다");
            console.error("- 만료 시간:", new Date(payload.exp * 1000).toLocaleString());
            console.error("- 현재 시간:", new Date().toLocaleString());
            return false;
        }
        
        console.log("✅ Supabase 설정 검증 완료:");
        console.log("- 프로젝트:", payload.ref);
        console.log("- 역할:", payload.role);
        console.log("- 만료:", new Date(payload.exp * 1000).toLocaleString());
        
        return true;
        
    } catch (error) {
        console.error("❌ Anon Key 검증 실패:", error.message);
        return false;
    }
}

// 설정 로드 이벤트
document.addEventListener('DOMContentLoaded', function() {
    if (validateSupabaseConfig()) {
        console.log("📋 Supabase 설정 로드 완료");
        
        // 설정 완료 이벤트 발생
        window.dispatchEvent(new Event('supabaseConfigReady'));
        document.dispatchEvent(new Event('supabaseConfigReady'));
    } else {
        // 설정 오류 시 사용자 안내
        const errorMessage = `
🚨 Supabase 연결에 문제가 있습니다.

해결 방법:
1. Supabase 대시보드(https://app.supabase.com)에 로그인
2. MCSELLER 프로젝트 → Settings → API 
3. "anon public" 키를 복사
4. js/supabase-config.js 파일의 anonKey 값 교체
5. 페이지 새로고침

문제가 지속되면 관리자에게 문의하세요.
        `.trim();
        
        console.error(errorMessage);
        
        // 개발 환경에서만 alert 표시
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            alert(errorMessage);
        }
    }
});

// 전역 접근을 위한 설정
window.getSupabaseConfig = function() {
    return window.SUPABASE_CONFIG;
};

console.log("📁 Supabase 설정 파일 로드됨"); 