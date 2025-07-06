/**
 * MCSELLER 마이페이지 - 프로덕션 버전
 */

// 페이지 초기화
async function initializeMyPage() {
    // Supabase 클라이언트 대기
    if (!window.supabaseClient) {
        await new Promise(resolve => {
            window.addEventListener('supabaseClientReady', resolve, { once: true });
        });
    }
    
    // 로그인 확인
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = '/auth.html';
        return;
    }
    
    // 사용자 정보 로드
    await loadUserInfo(user);
    
    // 구매한 콘텐츠 로드
    await loadPurchasedContent();
}

// 사용자 정보 로드
async function loadUserInfo(user) {
    try {
        // 프로필 정보 조회
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        
        // UI 업데이트
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userName').textContent = profile?.full_name || '회원님';
        document.getElementById('userPoints').textContent = `${(profile?.points || 0).toLocaleString()}원`;
        
        // 구매 건수 조회
        const { count } = await window.supabaseClient
            .from('purchased_content')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
        
        document.getElementById('purchaseCount').textContent = `${count || 0}개`;
        
    } catch (error) {
        console.error('사용자 정보 로드 오류:', error);
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