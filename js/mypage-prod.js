/**
 * MCSELLER 마이페이지 - 프로덕션 버전
 */

// 페이지 초기화
async function initializeMyPage() {
    console.log('🔄 마이페이지 초기화 시작...');
    
    try {
        // Supabase 클라이언트 대기
        if (!window.supabaseClient) {
            console.log('⏳ Supabase 클라이언트 대기 중...');
            await new Promise(resolve => {
                window.addEventListener('supabaseClientReady', resolve, { once: true });
            });
        }
        
        console.log('✅ Supabase 클라이언트 준비 완료');
        
        // 로그인 확인 (세션 기반으로 더 안정적)
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('❌ 세션 확인 오류:', error);
            showAuthError('인증 오류가 발생했습니다. 다시 로그인해주세요.');
            return;
        }
        
        if (!session || !session.user) {
            console.log('❌ 로그인 세션 없음');
            showAuthError('로그인이 필요합니다.');
            return;
        }
        
        console.log('✅ 사용자 인증 확인 완료:', session.user.email);
        
        // 이메일 확인 체크 제거 - 바로 진행
        
        // 사용자 정보 로드
        console.log('📊 사용자 정보 로딩 중...');
        await loadUserInfo(session.user);
        
        // 구매한 콘텐츠 로드
        console.log('📚 구매 콘텐츠 로딩 중...');
        await loadPurchasedContent();
        
        // 모든 로딩 완료
        console.log('✅ 마이페이지 로딩 완료');
        
        // 전역 사용자 정보 설정
        window.currentUser = session.user;
        
        // 실시간 인증 상태 감지 설정
        setupAuthStateListener();
        
    } catch (error) {
        console.error('❌ 마이페이지 초기화 중 오류:', error);
        showAuthError('페이지 로드 중 오류가 발생했습니다.');
    }
}

// 인증 오류 표시 함수 (자동 리다이렉트)
function showAuthError(message) {
    console.log('❌ 마이페이지 인증 실패:', message);
    
    // 즉시 로그인 페이지로 리다이렉트 (현재 페이지를 리다이렉트 파라미터로 전달)
    const currentPath = window.location.pathname;
    window.location.href = `/auth.html?redirect=${encodeURIComponent(currentPath)}`;
}

// 실시간 인증 상태 감지 설정
function setupAuthStateListener() {
    if (!window.supabaseClient) return;
    
    // 인증 상태 변화 감지
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('🔄 마이페이지에서 인증 상태 변화 감지:', event);
        
        if (event === 'SIGNED_OUT' || !session) {
            console.log('❌ 로그아웃 감지 - 로그인 페이지로 이동');
            window.currentUser = null;
            
            // 즉시 로그인 페이지로 리다이렉트
            const currentPath = window.location.pathname;
            window.location.href = `/auth.html?redirect=${encodeURIComponent(currentPath)}`;
        }
        // 새로운 로그인 감지 시 팝업 제거 - 불필요한 알림 방지
    });
}

// 사용자 정보 로드
async function loadUserInfo(user) {
    try {
        // 프로필 정보 조회
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116은 행이 없음을 의미
            console.warn('프로필 정보 조회 오류:', profileError);
        }
        
        // 관리자 권한 확인 및 리다이렉트 (강화된 로직)
        console.log('🔍 마이페이지에서 관리자 권한 확인 - 사용자:', user.email);
        
        // 관리자 이메일 목록 (1차 확인)
        const adminEmails = [
            'admin@mcseller.co.kr',
            'qwg18@naver.com',
            'mcseller@gmail.com', 
            'rvd3855@gmail.com'
        ];
        
        let isAdmin = adminEmails.includes(user.email);
        console.log('📧 이메일 기반 관리자 확인:', isAdmin);
        
        // 프로필 테이블에서도 확인 (2차 확인)
        if (!isAdmin && profile && profile.role === 'admin') {
            isAdmin = true;
            console.log('🔑 Supabase profiles 테이블에서 관리자 권한 확인됨');
        }
        
        if (isAdmin) {
            console.log("🔑 관리자 권한 감지 - 관리자 페이지로 리다이렉트");
            alert('관리자 계정입니다. 관리자 페이지로 이동합니다.');
            window.location.href = '/admin.html';
            return;
        }
        
        console.log('👤 일반 사용자 확인 - 마이페이지 계속 진행');
        
        // UI 업데이트 (실제 HTML ID와 일치하도록 수정)
        const userEmailElement = document.getElementById('user-email');
        const userPointsElement = document.getElementById('user-points');
        const userPointsStatElement = document.getElementById('user-points-stat');
        const joinDateElement = document.getElementById('join-date');
        
        // 이메일 업데이트
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
            console.log('✅ 이메일 업데이트:', user.email);
        }
        
        // 적립금 업데이트
        const points = profile?.points || 0;
        if (userPointsElement) {
            userPointsElement.textContent = `${points.toLocaleString()}원`;
            console.log('✅ 적립금 업데이트:', `${points.toLocaleString()}원`);
        }
        if (userPointsStatElement) {
            userPointsStatElement.textContent = points.toLocaleString();
        }
        
        // 가입일 업데이트
        if (joinDateElement && user.created_at) {
            const joinDate = new Date(user.created_at).toLocaleDateString('ko-KR');
            joinDateElement.textContent = joinDate;
            console.log('✅ 가입일 업데이트:', joinDate);
        }
        
        // 구매 건수 조회 (통계용)
        try {
            const { count, error: countError } = await window.supabaseClient
                .from('purchased_content')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);
            
            if (countError && countError.code !== 'PGRST101') { // 테이블 없음 오류 무시
                console.warn('구매 건수 조회 오류:', countError);
            } else {
                const totalCoursesElement = document.getElementById('total-courses');
                if (totalCoursesElement) {
                    totalCoursesElement.textContent = count || 0;
                    console.log('✅ 구매 건수 업데이트:', count || 0);
                }
            }
        } catch (error) {
            console.warn('⚠️ 구매 건수 조회 실패 (무시):', error);
        }
        
    } catch (error) {
        console.error('❌ 사용자 정보 로드 중 예상치 못한 오류:', error);
        
        // 기본 정보라도 표시
        const userEmailElement = document.getElementById('user-email');
        
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
            console.log('✅ 기본 이메일 정보 설정:', user.email);
        }
    }
}

// 구매한 콘텐츠 로드
async function loadPurchasedContent() {
    // 올바른 컨테이너 ID 사용 및 안전 처리
    const contentContainer = document.getElementById('my-courses');
    
    if (!contentContainer) {
        console.warn('⚠️ my-courses 요소를 찾을 수 없습니다. 기본 콘텐츠를 유지합니다.');
        return; // 요소가 없으면 기본 HTML 콘텐츠 유지
    }
    
    // 로딩 표시는 하지 않고 기존 콘텐츠 유지하면서 업데이트
    console.log('📚 기본 콘텐츠 유지 - 동적 콘텐츠 로딩 생략');
    
    try {
        // content-access.js 함수가 있는 경우에만 사용
        if (window.contentAccess && typeof window.contentAccess.getUserPurchases === 'function') {
            const purchases = await window.contentAccess.getUserPurchases();
            
            if (purchases && purchases.length > 0) {
                console.log(`✅ ${purchases.length}개의 구매 콘텐츠 발견`);
                // 여기서 동적 콘텐츠로 교체할 수 있지만, 현재는 기본 콘텐츠 유지
            } else {
                console.log('📦 구매한 콘텐츠가 없어 기본 샘플 콘텐츠 표시');
            }
        } else {
            console.log('📂 content-access.js 함수 없음 - 기본 콘텐츠 유지');
        }
        
        // 기본 HTML에 있는 콘텐츠를 그대로 사용
        // 추후 실제 구매 데이터와 연동할 때 수정 가능
        
    } catch (error) {
        console.warn('⚠️ 구매 콘텐츠 로드 중 오류 (기본 콘텐츠 유지):', error);
        // 오류가 발생해도 기본 콘텐츠는 그대로 유지
    }
}

// 로그아웃
async function logout() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (!error) {
        window.location.href = '/';
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initializeMyPage);