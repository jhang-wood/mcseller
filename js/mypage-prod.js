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
        
        // 모든 로딩 완료 - UI 표시
        console.log('✅ 마이페이지 로딩 완료');
        document.body.style.opacity = '1';
        
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
        } else if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ 새로운 로그인 감지:', session.user.email);
            window.currentUser = session.user;
            
            // 페이지 새로고침하여 최신 데이터 로드
            if (confirm('새로운 계정으로 로그인되었습니다. 페이지를 새로고침하시겠습니까?')) {
                window.location.reload();
            }
        }
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
        
        // UI 업데이트 (요소 존재 여부 확인)
        const userEmailElement = document.getElementById('userEmail');
        const userNameElement = document.getElementById('userName');
        const userPointsElement = document.getElementById('userPoints');
        const purchaseCountElement = document.getElementById('purchaseCount');
        
        if (userEmailElement) userEmailElement.textContent = user.email;
        if (userNameElement) userNameElement.textContent = profile?.full_name || user.user_metadata?.full_name || '회원님';
        if (userPointsElement) userPointsElement.textContent = `${(profile?.points || 0).toLocaleString()}원`;
        
        // 구매 건수 조회
        const { count, error: countError } = await window.supabaseClient
            .from('purchased_content')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        
        if (countError) {
            console.warn('구매 건수 조회 오류:', countError);
        }
        
        if (purchaseCountElement) purchaseCountElement.textContent = `${count || 0}개`;
        
    } catch (error) {
        console.error('사용자 정보 로드 중 예상치 못한 오류:', error);
        
        // 기본 정보라도 표시
        const userEmailElement = document.getElementById('userEmail');
        const userNameElement = document.getElementById('userName');
        
        if (userEmailElement) userEmailElement.textContent = user.email;
        if (userNameElement) userNameElement.textContent = user.user_metadata?.full_name || '회원님';
    }
}

// 구매한 콘텐츠 로드
async function loadPurchasedContent() {
    const contentContainer = document.getElementById('purchasedContent');
    contentContainer.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> 로딩 중...</div>';
    
    try {
        // content-access.js의 함수 사용
        const purchases = await window.contentAccess.getUserPurchases();
        
        if (!purchases || purchases.length === 0) {
            contentContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted">구매한 콘텐츠가 없습니다.</p>
                    <a href="/" class="btn btn-primary mt-3">콘텐츠 둘러보기</a>
                </div>
            `;
            return;
        }
        
        // 구매한 콘텐츠 표시
        const contentHTML = purchases.map(purchase => {
            const product = purchase.products;
            const contentIcon = product.product_type === 'ebook' ? 'fa-book' : 'fa-video';
            const viewerUrl = product.product_type === 'ebook' ? '/ebook-viewer.html' : '/video-viewer.html';
            
            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm">
                        ${product.image_url ? `<img src="${product.image_url}" class="card-img-top" alt="${product.title}">` : ''}
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="card-text text-muted small">${product.description || ''}</p>
                            <div class="d-flex align-items-center mb-3">
                                <i class="fas ${contentIcon} text-primary me-2"></i>
                                <span class="badge bg-secondary">${product.product_type === 'ebook' ? '전자책' : '동영상 강의'}</span>
                            </div>
                            <a href="${viewerUrl}?id=${product.id}" class="btn btn-primary w-100">
                                <i class="fas fa-play me-2"></i>콘텐츠 보기
                            </a>
                        </div>
                        <div class="card-footer text-muted small">
                            구매일: ${new Date(purchase.access_granted_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        contentContainer.innerHTML = `<div class="row">${contentHTML}</div>`;
        
    } catch (error) {
        console.error('구매 콘텐츠 로드 오류:', error);
        contentContainer.innerHTML = `
            <div class="alert alert-danger">
                콘텐츠를 불러오는 중 오류가 발생했습니다.
            </div>
        `;
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