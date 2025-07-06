// 환경 변수 로더
// 서버에서 환경 변수를 가져와 전역으로 설정합니다
(async function loadEnvironmentVariables() {
    try {
        const response = await fetch('/api/env');
        const env = await response.json();
        
        // 전역 변수로 설정
        window.SUPABASE_URL = env.SUPABASE_URL;
        window.SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
        
        console.log('환경 변수가 로드되었습니다');
        
        // 환경 변수 로드 완료 이벤트 발생
        window.dispatchEvent(new Event('envLoaded'));
    } catch (error) {
        console.error('환경 변수 로드 실패:', error);
    }
})();