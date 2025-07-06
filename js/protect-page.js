// 페이지 보호 스크립트 - 로그인되지 않은 사용자를 auth.html로 리디렉션
(async function() {
    console.log('🛡️ 페이지 보호 스크립트 실행 중...');
    
    try {
        // Supabase 클라이언트가 로드될 때까지 대기 (더 길게)
        let attempts = 0;
        const maxAttempts = 100; // 10초 대기
        
        while (!window.supabaseClient && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.supabaseClient) {
            console.log('❌ Supabase 클라이언트를 찾을 수 없음');
            return; // 리다이렉트하지 않고 기다림
        }
        
        console.log('✅ Supabase 클라이언트 확인 완료');
        
        // 세션 확인 (getUser보다 안전함)
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('세션 확인 오류:', error);
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000); // 2초 후 이동
            return;
        }
        
        if (!session || !session.user) {
            console.log('❌ 로그인 세션이 없음, 로그인 페이지로 이동');
            setTimeout(() => {
                window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.pathname);
            }, 1000); // 1초 후 이동
            return;
        }
        
        // 이메일 확인 체크 제거 - 바로 진행
        
        console.log('✅ 사용자 인증 완료:', session.user.email);
        
        // 전역 사용자 정보 설정
        window.currentUser = session.user;
        
    } catch (error) {
        console.error('❌ 페이지 보호 확인 중 오류:', error);
        // 즉시 리다이렉트하지 않고 잠시 기다림
        setTimeout(() => {
            if (!window.currentUser) {
                window.location.href = 'auth.html';
            }
        }, 3000);
    }
})();