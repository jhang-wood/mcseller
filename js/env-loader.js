// 환경 변수 로더 (현재 사용하지 않음)
// supabase-client-prod.js에서 직접 설정하므로 이 파일은 선택적입니다
(async function loadEnvironmentVariables() {
    try {
        const response = await fetch('/api/env');
        
        // 응답이 유효한지 확인
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.log('⚠️ 환경 변수 API가 JSON을 반환하지 않음 - supabase-client-prod.js에서 직접 설정 사용');
            return;
        }
        
        const env = await response.json();
        
        // 전역 변수로 설정
        window.SUPABASE_URL = env.SUPABASE_URL;
        window.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
        
        console.log('✅ 환경 변수가 로드되었습니다');
        
        // 환경 변수 로드 완료 이벤트 발생
        window.dispatchEvent(new Event('envLoaded'));
    } catch (error) {
        console.log('⚠️ 환경 변수 로드 실패 (무시됨):', error.message);
        console.log('🔧 supabase-client-prod.js에서 직접 설정된 값을 사용합니다');
        
        // 오류가 발생해도 이벤트 발생 (다른 스크립트가 기다리고 있을 수 있음)
        window.dispatchEvent(new Event('envLoaded'));
    }
})();