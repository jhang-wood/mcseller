/**
 * MCSELLER 마이페이지 스크립트
 */

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", function() {
    console.log("마이페이지 DOM 로드 완료");
    initializeMyPage();
});

// 마이페이지 초기화
async function initializeMyPage() {
    console.log("🏠 마이페이지 초기화 시작");
    
    // Supabase 클라이언트 대기
    let attempts = 0;
    while (!window.supabaseClient && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    if (!window.supabaseClient) {
        console.error("❌ Supabase 클라이언트를 찾을 수 없음");
        return;
    }
    
    // 현재 사용자 정보 로드
    await loadUserInfo();
    
    // 구매한 콘텐츠 로드
    await loadPurchasedContent();
    
    console.log("✅ 마이페이지 초기화 완료");
}

// 사용자 정보 로드
async function loadUserInfo() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error || !session) {
            console.error("세션 오류:", error);
            return;
        }
        
        const user = session.user;
        console.log("✅ 사용자 정보 로드:", user.email);
        
        // UI 업데이트
        document.getElementById("user-email").textContent = user.email;
        
        // 가입일 포맷
        const joinDate = new Date(user.created_at).toLocaleDateString('ko-KR');
        document.getElementById("join-date").textContent = joinDate;
        
        // 사용자 프로필 정보 로드
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('uuid', user.id)
            .single();
            
        if (profile) {
            console.log("프로필 정보:", profile);
            // 추가 프로필 정보 표시 가능
        }
        
    } catch (error) {
        console.error("❌ 사용자 정보 로드 오류:", error);
    }
}

// 구매한 콘텐츠 로드
async function loadPurchasedContent() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error || !session) {
            console.error("세션 오류:", error);
            return;
        }
        
        // 구매 내역 조회
        const { data: purchases, error: purchaseError } = await window.supabaseClient
            .from('purchases')
            .select(`
                *,
                products (
                    id,
                    name,
                    description,
                    type,
                    price
                )
            `)
            .eq('user_id', session.user.id);
            
        if (purchaseError) {
            console.error("구매 내역 조회 오류:", purchaseError);
            return;
        }
        
        console.log("✅ 구매 내역 로드:", purchases);
        
        // UI 업데이트
        const contentContainer = document.getElementById("purchased-content");
        if (contentContainer && purchases && purchases.length > 0) {
            contentContainer.innerHTML = purchases.map(purchase => `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${purchase.products.name}</h6>
                            <p class="card-text text-muted">${purchase.products.description}</p>
                            <small class="text-muted">구매일: ${new Date(purchase.purchased_at).toLocaleDateString('ko-KR')}</small>
                            <br>
                            <button class="btn btn-primary btn-sm mt-2" onclick="viewContent('${purchase.products.id}', '${purchase.products.type}')">
                                ${purchase.products.type === 'ebook' ? '전자책 읽기' : '강의 보기'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            if (contentContainer) {
                contentContainer.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            아직 구매한 콘텐츠가 없습니다.
                            <a href="index.html" class="alert-link">메인페이지에서 콘텐츠를 둘러보세요!</a>
                        </div>
                    </div>
                `;
            }
        }
        
    } catch (error) {
        console.error("❌ 구매한 콘텐츠 로드 오류:", error);
    }
}

// 콘텐츠 보기
function viewContent(productId, type) {
    console.log("콘텐츠 보기:", productId, type);
    
    if (type === 'ebook') {
        window.location.href = `ebook-viewer.html?id=${productId}`;
    } else {
        window.location.href = `video-viewer.html?id=${productId}`;
    }
}

// 로그아웃
async function logout() {
    console.log("🚪 로그아웃 시작");
    
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        
        if (error) {
            console.error("로그아웃 오류:", error);
            alert("로그아웃 중 오류가 발생했습니다.");
            return;
        }
        
        console.log("✅ 로그아웃 완료");
        
        // 로컬 데이터 정리
        localStorage.removeItem("rememberEmail");
        window.currentUser = null;
        
        alert("로그아웃되었습니다.");
        window.location.href = "index.html";
        
    } catch (error) {
        console.error("❌ 로그아웃 처리 오류:", error);
        alert("로그아웃 중 오류가 발생했습니다.");
    }
}

// 전역 함수로 등록
window.logout = logout;
window.viewContent = viewContent;

console.log("mypage.js 로드 완료");