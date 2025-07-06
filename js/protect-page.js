// 페이지 보호 스크립트 - 로그인되지 않은 사용자를 auth.html로 리디렉션
(async function() {
    console.log('페이지 보호 스크립트 실행 중...');
    
    try {
        // Supabase 클라이언트가 로드될 때까지 대기
        let attempts = 0;
        const maxAttempts = 50; // 5초 대기
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.log('Supabase 클라이언트를 찾을 수 없음, 로그인 페이지로 이동');
            window.location.href = 'auth.html';
            return;
        }
        
        // 현재 사용자 확인
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
            console.error('사용자 인증 확인 오류:', error);
            window.location.href = 'auth.html';
            return;
        }
        
        if (!user) {
            console.log('로그인되지 않은 사용자, 로그인 페이지로 이동');
            window.location.href = 'auth.html';
            return;
        }
        
        console.log('사용자 인증 확인 완료:', user.email);
        
    } catch (error) {
        console.error('페이지 보호 확인 중 오류:', error);
        window.location.href = 'auth.html';
    }
})();