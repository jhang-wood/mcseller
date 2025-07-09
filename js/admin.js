// MCSELLER 관리자 페이지 - 완전한 콘텐츠 관리 시스템 v3.0
console.log('🚀 관리자 페이지 JavaScript v3.0 로드됨 - 완전한 콘텐츠 관리 시스템');

let currentUser = null;

// 페이지 초기화
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔄 관리자 페이지 초기화...');
    
    // Supabase 클라이언트 대기
    if (!window.supabaseClient) {
        console.log('⏳ Supabase 클라이언트 대기 중...');
        await new Promise(resolve => {
            const checkClient = () => {
                if (window.supabaseClient) {
                    resolve();
                } else {
                    setTimeout(checkClient, 100);
                }
            };
            checkClient();
        });
    }
    
    console.log('✅ Supabase 클라이언트 로드됨');
    
    // 관리자 권한 확인
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;
    
    // 사이드바 네비게이션 설정
    setupNavigation();
    
    // 기본 섹션 로드
    loadSection('users');
    
    console.log('✅ 관리자 페이지 초기화 완료');
});

// 관리자 권한 확인
async function checkAdminAccess() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (!session || !session.user) {
            alert('로그인이 필요합니다.');
            window.location.href = '/auth.html';
            return false;
        }
        
        // 관리자 이메일 확인
        const adminEmails = [
            'admin@mcseller.co.kr',
            'qwg18@naver.com',
            'mcseller@gmail.com',
            'rvd3855@gmail.com'
        ];
        
        if (!adminEmails.includes(session.user.email)) {
            alert('관리자 권한이 없습니다.');
            window.location.href = '/mypage.html';
            return false;
        }
        
        currentUser = session.user;
        console.log('✅ 관리자 접근 허용:', session.user.email);
        return true;
        
    } catch (error) {
        console.error('권한 확인 오류:', error);
        window.location.href = '/auth.html';
        return false;
    }
}

// 네비게이션 설정
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                // 활성 링크 업데이트
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // 섹션 로드
                loadSection(section);
            }
        });
    });
}

// 섹션 로드
function loadSection(sectionName) {
    // 모든 섹션 숨김
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 선택된 섹션 표시
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // 섹션별 데이터 로드
        switch (sectionName) {
            case 'users':
                loadAllUsers();
                break;
            case 'coupons':
                loadCoupons();
                break;
            case 'points':
                loadPoints();
                break;
            case 'content':
                loadContent();
                break;
            case 'reviews':
                loadReviews();
                break;
        }
    }
}

// === 회원관리 ===
async function loadAllUsers() {
    try {
        console.log('📋 회원 목록 로드 시작...');
        
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase 오류:', error);
            throw error;
        }
        
        console.log('✅ 회원 데이터 로드 완료:', profiles?.length || 0, '명');
        
        const tbody = document.getElementById('usersTable');
        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">회원이 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = profiles.map(user => `
            <tr>
                <td>${user.email || '이메일 없음'}</td>
                <td>${user.full_name || '미설정'}</td>
                <td>
                    <select class="form-control form-control-sm" onchange="updateUserRole('${user.id}', this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반회원</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                    </select>
                </td>
                <td>${(user.points || 0).toLocaleString()}원</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : '날짜 없음'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUserPoints('${user.id}', ${user.points || 0})">
                        적립금 수정
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('회원 목록 로드 오류:', error);
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = `
            <tr><td colspan="6">
                로드 오류: ${error.message || '알 수 없는 오류'}<br>
                <small>콘솔에서 자세한 오류 내용을 확인하세요.</small>
            </td></tr>
        `;
    }
}

async function searchUsers() {
    const email = document.getElementById('userSearch').value.trim();
    if (!email) {
        loadAllUsers();
        return;
    }
    
    try {
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .ilike('email', `%${email}%`);
        
        if (error) throw error;
        
        const tbody = document.getElementById('usersTable');
        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">검색 결과가 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = profiles.map(user => `
            <tr>
                <td>${user.email}</td>
                <td>${user.full_name || '미설정'}</td>
                <td>${user.role}</td>
                <td>${(user.points || 0).toLocaleString()}원</td>
                <td>${user.updated_at ? new Date(user.updated_at).toLocaleDateString() : '날짜 없음'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUserPoints('${user.id}', ${user.points || 0})">
                        적립금 수정
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('회원 검색 오류:', error);
    }
}

async function updateUserRole(userId, newRole) {
    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert('역할이 업데이트되었습니다.');
        
    } catch (error) {
        console.error('역할 업데이트 오류:', error);
        alert('역할 업데이트에 실패했습니다.');
        loadAllUsers();
    }
}

function editUserPoints(userId, currentPoints) {
    const newPoints = prompt(`새로운 적립금을 입력하세요 (현재: ${currentPoints.toLocaleString()}원):`, currentPoints);
    if (newPoints !== null && !isNaN(newPoints)) {
        updateUserPoints(userId, parseInt(newPoints));
    }
}

async function updateUserPoints(userId, newPoints) {
    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ points: newPoints })
            .eq('id', userId);
        
        if (error) throw error;
        
        alert('적립금이 업데이트되었습니다.');
        loadAllUsers();
        
    } catch (error) {
        console.error('적립금 업데이트 오류:', error);
        alert('적립금 업데이트에 실패했습니다.');
    }
}

// === 할인쿠폰 관리 ===
async function loadCoupons() {
    try {
        const { data: coupons, error } = await window.supabaseClient
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });
        
        const tbody = document.getElementById('couponsTable');
        
        if (error) {
            console.warn('쿠폰 테이블 조회 오류:', error);
            tbody.innerHTML = '<tr><td colspan="6">쿠폰 테이블이 없습니다. 관리자가 테이블을 생성해야 합니다.</td></tr>';
            return;
        }
        
        if (!coupons || coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">쿠폰이 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = coupons.map(coupon => `
            <tr>
                <td><strong>${coupon.code}</strong></td>
                <td>
                    ${coupon.discount_type === 'percentage' ? 
                        `${coupon.discount_value}%` : 
                        `${coupon.discount_value.toLocaleString()}원`}
                </td>
                <td>${coupon.used_count || 0} / ${coupon.max_uses || '무제한'}</td>
                <td>${coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString() : '무제한'}</td>
                <td>
                    <span class="badge ${coupon.is_active ? 'bg-success' : 'bg-secondary'}">
                        ${coupon.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteCoupon('${coupon.id}')">삭제</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('쿠폰 목록 로드 오류:', error);
        document.getElementById('couponsTable').innerHTML = '<tr><td colspan="6">로드 오류</td></tr>';
    }
}

async function ensureCouponsTable() {
    // 쿠폰 테이블은 Supabase 대시보드에서 수동으로 생성해야 합니다
    console.log('쿠폰 테이블 확인... (수동 생성 필요)');
}

function showAddCouponModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCouponModal'));
    document.getElementById('couponForm').reset();
    modal.show();
}

async function saveCoupon() {
    try {
        console.log('🎫 새 쿠폰 생성 시작...');
        
        const code = document.getElementById('couponCode').value;
        const discountType = document.getElementById('discountType').value;
        const discountValue = parseInt(document.getElementById('discountValue').value);
        const maxUses = parseInt(document.getElementById('maxUses').value);
        const expiryDate = document.getElementById('expiryDate').value;
        
        if (!code || !discountValue) {
            alert('쿠폰 코드와 할인값을 입력해주세요.');
            return;
        }
        
        console.log('쿠폰 데이터:', {
            code: code.toUpperCase(),
            discount_type: discountType,
            discount_value: discountValue,
            max_uses: maxUses || null,
            valid_until: expiryDate || null
        });
        
        const { error } = await window.supabaseClient
            .from('coupons')
            .insert({
                code: code.toUpperCase(),
                discount_type: discountType,
                discount_value: discountValue,
                max_uses: maxUses || null,
                valid_until: expiryDate || null
            });
        
        if (error) {
            console.error('Supabase 쿠폰 생성 오류:', error);
            throw error;
        }
        
        console.log('✅ 쿠폰 생성 성공!');
        alert('쿠폰이 생성되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('addCouponModal')).hide();
        loadCoupons();
        
    } catch (error) {
        console.error('쿠폰 생성 오류:', error);
        alert('쿠폰 생성에 실패했습니다: ' + error.message);
    }
}

// 쿠폰 토글 기능 제거 (단순화)

async function deleteCoupon(couponId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('coupons')
            .delete()
            .eq('id', couponId);
        
        if (error) throw error;
        
        loadCoupons();
        
    } catch (error) {
        console.error('쿠폰 삭제 오류:', error);
        alert('쿠폰 삭제에 실패했습니다.');
    }
}

// === 적립금 관리 ===
async function loadPoints() {
    try {
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('email, points')
            .order('points', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('pointsTable');
        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3">회원이 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = profiles.map(user => `
            <tr>
                <td>${user.email}</td>
                <td>${(user.points || 0).toLocaleString()}원</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="showPointEditModal('${user.email}', ${user.points || 0})">
                        수정
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('적립금 목록 로드 오류:', error);
        document.getElementById('pointsTable').innerHTML = '<tr><td colspan="3">로드 오류</td></tr>';
    }
}

async function addPoints() {
    const email = document.getElementById('pointUserEmail').value.trim();
    const amount = parseInt(document.getElementById('pointAmount').value);
    
    if (!email || !amount) {
        alert('이메일과 금액을 입력해주세요.');
        return;
    }
    
    try {
        // 현재 적립금 조회
        const { data: users, error: getUserError } = await window.supabaseClient
            .from('profiles')
            .select('points')
            .eq('email', email);
        
        if (getUserError) throw getUserError;
        
        if (!users || users.length === 0) {
            throw new Error('해당 이메일의 사용자를 찾을 수 없습니다.');
        }
        
        const user = users[0];
        
        const newPoints = (user.points || 0) + amount;
        
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ points: newPoints })
            .eq('email', email);
        
        if (error) throw error;
        
        alert(`${email}에게 ${amount.toLocaleString()}원이 추가되었습니다.`);
        document.getElementById('pointUserEmail').value = '';
        document.getElementById('pointAmount').value = '';
        loadPoints();
        
    } catch (error) {
        console.error('적립금 추가 오류:', error);
        alert('적립금 추가에 실패했습니다.');
    }
}

function showPointEditModal(email, currentPoints) {
    const newPoints = prompt(`${email}의 새로운 적립금을 입력하세요 (현재: ${currentPoints.toLocaleString()}원):`, currentPoints);
    if (newPoints !== null && !isNaN(newPoints)) {
        updateUserPointsByEmail(email, parseInt(newPoints));
    }
}

async function updateUserPointsByEmail(email, newPoints) {
    try {
        const { error } = await window.supabaseClient
            .from('profiles')
            .update({ points: newPoints })
            .eq('email', email);
        
        if (error) throw error;
        
        alert('적립금이 업데이트되었습니다.');
        loadPoints();
        
    } catch (error) {
        console.error('적립금 업데이트 오류:', error);
        alert('적립금 업데이트에 실패했습니다.');
    }
}

// === 콘텐츠 관리 ===
// 콘텐츠 탭 관리
function showContentTab(tabName) {
    // 모든 탭 비활성화
    document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // 모든 탭 링크 비활성화
    document.querySelectorAll('#contentTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // 선택된 탭 활성화
    document.getElementById(`content-${tabName}-tab`).classList.add('active');
    document.getElementById(`content-${tabName}-tab`).style.display = 'block';
    
    // 탭 링크 활성화
    event.target.classList.add('active');
    
    // 탭별 데이터 로드
    switch(tabName) {
        case 'list':
            loadContent();
            break;
        case 'purchases':
            loadContentSelectOptions();
            break;
        case 'editor':
            loadContentSelectOptionsForEditor();
            break;
    }
}

async function loadContent() {
    try {
        const { data: contents, error } = await window.supabaseClient
            .from('contents')
            .select('*')
            .order('created_at', { ascending: false });
        
        const tbody = document.getElementById('contentTable');
        
        if (error) {
            console.warn('콘텐츠 테이블 조회 오류:', error);
            tbody.innerHTML = '<tr><td colspan="7">콘텐츠 테이블이 없습니다.</td></tr>';
            return;
        }
        
        if (!contents || contents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">콘텐츠가 없습니다.</td></tr>';
            return;
        }
        
        // 각 콘텐츠의 구매자 수 조회
        const contentsWithPurchaseCount = await Promise.all(contents.map(async (content) => {
            try {
                const { count } = await window.supabaseClient
                    .from('purchases')
                    .select('*', { count: 'exact', head: true })
                    .eq('content_id', content.id);
                return { ...content, purchaseCount: count || 0 };
            } catch {
                return { ...content, purchaseCount: 0 };
            }
        }));
        
        tbody.innerHTML = contentsWithPurchaseCount.map(content => `
            <tr>
                <td><strong>${content.title}</strong></td>
                <td>
                    <span class="badge bg-${content.type === 'ebook' ? 'info' : 'success'}">
                        ${content.type === 'ebook' ? '전자책' : '강의'}
                    </span>
                </td>
                <td>${content.price ? content.price.toLocaleString() : '0'}원</td>
                <td>${content.purchaseCount}명</td>
                <td>
                    <span class="badge bg-${content.status === 'active' ? 'success' : 'secondary'}">
                        ${content.status === 'active' ? '활성' : '비활성'}
                    </span>
                </td>
                <td>${content.created_at ? new Date(content.created_at).toLocaleDateString() : '날짜 없음'}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editContentInTab('${content.id}')">편집</button>
                    <button class="btn btn-sm btn-warning me-1" onclick="toggleContent('${content.id}', '${content.status === 'active' ? 'inactive' : 'active'}')">
                        ${content.status === 'active' ? '비활성화' : '활성화'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteContent('${content.id}')">삭제</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('콘텐츠 목록 로드 오류:', error);
        document.getElementById('contentTable').innerHTML = '<tr><td colspan="7">로드 오류</td></tr>';
    }
}

async function ensureContentTable() {
    // 콘텐츠 테이블 확인/생성 로직
    console.log('콘텐츠 테이블 확인 중...');
}

function showAddContentModal(type) {
    document.getElementById('contentType').value = type;
    document.getElementById('contentModalTitle').textContent = 
        type === 'ebook' ? '전자책 추가' : '강의 추가';
    
    const modal = new bootstrap.Modal(document.getElementById('addContentModal'));
    document.getElementById('contentForm').reset();
    modal.show();
}

// 구매자 관리 함수들
async function loadContentSelectOptions() {
    try {
        const { data: contents, error } = await window.supabaseClient
            .from('contents')
            .select('id, title')
            .eq('status', 'active');
        
        const select = document.getElementById('purchaseContentSelect');
        select.innerHTML = '<option value="">콘텐츠를 선택하세요</option>';
        
        if (contents) {
            contents.forEach(content => {
                select.innerHTML += `<option value="${content.id}">${content.title}</option>`;
            });
        }
    } catch (error) {
        console.error('콘텐츠 목록 로드 오류:', error);
    }
}

async function loadPurchasers() {
    const contentId = document.getElementById('purchaseContentSelect').value;
    const tbody = document.getElementById('purchasersTable');
    
    if (!contentId) {
        tbody.innerHTML = '<tr><td colspan="5">콘텐츠를 선택하세요</td></tr>';
        return;
    }
    
    try {
        const { data: purchases, error } = await window.supabaseClient
            .from('purchases')
            .select(`
                *,
                profiles!inner(email)
            `)
            .eq('content_id', contentId);
        
        if (error) {
            console.warn('구매자 정보 조회 오류:', error);
            tbody.innerHTML = '<tr><td colspan="5">구매자 정보를 불러올 수 없습니다.</td></tr>';
            return;
        }
        
        if (!purchases || purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">구매자가 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = purchases.map(purchase => `
            <tr>
                <td>${purchase.profiles.email}</td>
                <td>${purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '날짜 없음'}</td>
                <td>${purchase.expiry_date ? new Date(purchase.expiry_date).toLocaleDateString() : '무제한'}</td>
                <td>
                    <span class="badge bg-${purchase.status === 'active' ? 'success' : 'secondary'}">
                        ${purchase.status === 'active' ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removePurchaser('${purchase.id}')">제거</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('구매자 로드 오류:', error);
        tbody.innerHTML = '<tr><td colspan="5">로드 오류</td></tr>';
    }
}

function showAddPurchaseModal() {
    const contentId = document.getElementById('purchaseContentSelect').value;
    if (!contentId) {
        alert('먼저 콘텐츠를 선택하세요.');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('addPurchaseModal'));
    document.getElementById('purchaseForm').reset();
    modal.show();
}

async function addPurchaser() {
    const contentId = document.getElementById('purchaseContentSelect').value;
    const email = document.getElementById('purchaseUserEmail').value.trim();
    const expiryDate = document.getElementById('purchaseExpiryDate').value;
    
    if (!email) {
        alert('이메일을 입력하세요.');
        return;
    }
    
    try {
        // 사용자 ID 조회
        const { data: profiles, error: userError } = await window.supabaseClient
            .from('profiles')
            .select('id')
            .eq('email', email);
        
        if (userError || !profiles || profiles.length === 0) {
            alert('해당 이메일의 사용자를 찾을 수 없습니다.');
            return;
        }
        
        const userId = profiles[0].id;
        
        // 구매 기록 추가
        const { error } = await window.supabaseClient
            .from('purchases')
            .insert({
                user_id: userId,
                content_id: contentId,
                purchase_date: new Date().toISOString(),
                expiry_date: expiryDate || null,
                status: 'active'
            });
        
        if (error) throw error;
        
        alert('구매자가 추가되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('addPurchaseModal')).hide();
        loadPurchasers();
        
    } catch (error) {
        console.error('구매자 추가 오류:', error);
        alert('구매자 추가에 실패했습니다: ' + error.message);
    }
}

async function removePurchaser(purchaseId) {
    if (!confirm('정말 제거하시겠습니까?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('purchases')
            .delete()
            .eq('id', purchaseId);
        
        if (error) throw error;
        
        loadPurchasers();
        
    } catch (error) {
        console.error('구매자 제거 오류:', error);
        alert('구매자 제거에 실패했습니다.');
    }
}

// 콘텐츠 편집 함수들
async function loadContentSelectOptionsForEditor() {
    try {
        const { data: contents, error } = await window.supabaseClient
            .from('contents')
            .select('id, title')
            .order('created_at', { ascending: false });
        
        const select = document.getElementById('editorContentSelect');
        select.innerHTML = '<option value="">편집할 콘텐츠를 선택하세요</option>';
        
        if (contents) {
            contents.forEach(content => {
                select.innerHTML += `<option value="${content.id}">${content.title}</option>`;
            });
        }
    } catch (error) {
        console.error('콘텐츠 목록 로드 오류:', error);
    }
}

let currentEditingContent = null;

async function loadContentForEdit() {
    const contentId = document.getElementById('editorContentSelect').value;
    const editorArea = document.getElementById('contentEditorArea');
    
    if (!contentId) {
        editorArea.style.display = 'none';
        document.getElementById('saveContentBtn').disabled = true;
        document.getElementById('previewContentBtn').disabled = true;
        return;
    }
    
    try {
        const { data: content, error } = await window.supabaseClient
            .from('contents')
            .select('*')
            .eq('id', contentId)
            .single();
        
        if (error) throw error;
        
        currentEditingContent = content;
        
        // 폼에 데이터 채우기
        document.getElementById('editingContentTitle').textContent = `${content.title} 편집`;
        document.getElementById('editContentTitle').value = content.title || '';
        document.getElementById('editContentDescription').value = content.description || '';
        document.getElementById('editContentPrice').value = content.price || '';
        document.getElementById('editContentImageUrl').value = content.image_url || '';
        document.getElementById('editContentData').value = content.content || '';
        
        editorArea.style.display = 'block';
        document.getElementById('saveContentBtn').disabled = false;
        document.getElementById('previewContentBtn').disabled = false;
        
    } catch (error) {
        console.error('콘텐츠 로드 오류:', error);
        alert('콘텐츠를 불러올 수 없습니다.');
    }
}

async function saveContentChanges() {
    if (!currentEditingContent) return;
    
    try {
        const updatedData = {
            title: document.getElementById('editContentTitle').value,
            description: document.getElementById('editContentDescription').value,
            price: parseInt(document.getElementById('editContentPrice').value) || 0,
            image_url: document.getElementById('editContentImageUrl').value,
            content: document.getElementById('editContentData').value,
            updated_at: new Date().toISOString()
        };
        
        const { error } = await window.supabaseClient
            .from('contents')
            .update(updatedData)
            .eq('id', currentEditingContent.id);
        
        if (error) throw error;
        
        alert('콘텐츠가 저장되었습니다.');
        loadContent(); // 목록 새로고침
        
    } catch (error) {
        console.error('콘텐츠 저장 오류:', error);
        alert('콘텐츠 저장에 실패했습니다.');
    }
}

function previewContent() {
    if (!currentEditingContent) return;
    
    const content = document.getElementById('editContentData').value;
    const title = document.getElementById('editContentTitle').value;
    const contentType = currentEditingContent.type || 'course';
    
    // 콘텐츠 유형에 따라 적절한 뷰어로 미리보기
    if (contentType === 'course') {
        // 동영상 강의용 뷰어
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title} - 미리보기</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; }
                    .sidebar { 
                        position: fixed; left: 0; top: 0; height: 100vh; width: 300px; 
                        background: #f8f9fa; border-right: 1px solid #dee2e6; z-index: 1000;
                        transition: transform 0.3s ease; overflow-y: auto;
                    }
                    .content { margin-left: 300px; padding: 20px; transition: margin-left 0.3s ease; }
                    .video-container { position: relative; width: 100%; height: 0; padding-bottom: 56.25%; margin-bottom: 20px; }
                    .video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
                    .lesson-description { background: #f8f9fa; padding: 20px; border-radius: 8px; }
                    .lesson-item { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #eee; }
                    .lesson-item:hover { background: #e9ecef; }
                    .lesson-item.active { background: #007bff; color: white; }
                    .preview-badge { position: fixed; top: 10px; right: 10px; z-index: 1051; }
                </style>
            </head>
            <body>
                <span class="badge bg-warning text-dark preview-badge">관리자 미리보기</span>
                
                <!-- 사이드바 -->
                <div class="sidebar">
                    <div class="p-3 border-bottom">
                        <h5><i class="fas fa-play-circle me-2"></i>강의 목차</h5>
                    </div>
                    <div class="lesson-item active">
                        <div class="fw-bold">${title}</div>
                        <small class="text-muted">미리보기</small>
                    </div>
                    <div class="p-3 border-top">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            미리보기 모드
                        </small>
                    </div>
                </div>

                <!-- 상단 네비게이션 -->
                <nav class="navbar navbar-dark bg-dark">
                    <div class="container-fluid">
                        <a class="navbar-brand" href="#">
                            <i class="fas fa-eye me-2"></i>미리보기 모드
                        </a>
                        <span class="navbar-text">${title}</span>
                    </div>
                </nav>

                <!-- 메인 콘텐츠 -->
                <div class="content">
                    <div class="lesson-description">
                        ${content}
                    </div>
                </div>
            </body>
            </html>
        `);
    } else if (contentType === 'ebook') {
        // 전자책용 뷰어
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title} - 전자책 미리보기</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; background: #f7f3e9; color: #5d4037; line-height: 1.7; }
                    .sidebar { position: fixed; left: 0; top: 0; height: 100vh; width: 300px; background: #f4ead5; border-right: 1px solid #d7ccc8; z-index: 1000; overflow-y: auto; }
                    .content { margin-left: 300px; padding: 20px; max-width: 800px; }
                    .ebook-content { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 20px rgba(139, 110, 92, 0.15); }
                    .chapter-item { padding: 12px 15px; cursor: pointer; border-bottom: 1px solid #d7ccc8; }
                    .chapter-item:hover { background: #f0e6d2; }
                    .chapter-item.active { background: #8d6e63; color: white; }
                    .preview-badge { position: fixed; top: 10px; right: 10px; z-index: 1051; }
                </style>
            </head>
            <body>
                <span class="badge bg-warning text-dark preview-badge">관리자 미리보기</span>
                
                <!-- 사이드바 -->
                <div class="sidebar">
                    <div class="p-3 border-bottom">
                        <h5><i class="fas fa-book me-2"></i>목차</h5>
                    </div>
                    <div class="chapter-item active">
                        <div class="fw-bold">${title}</div>
                        <small class="text-muted">미리보기</small>
                    </div>
                    <div class="p-3 border-top">
                        <small class="text-muted">
                            <i class="fas fa-info-circle me-1"></i>
                            미리보기 모드
                        </small>
                    </div>
                </div>

                <!-- 상단 네비게이션 -->
                <nav class="navbar navbar-dark bg-dark">
                    <div class="container-fluid">
                        <a class="navbar-brand" href="#">
                            <i class="fas fa-eye me-2"></i>전자책 미리보기
                        </a>
                        <span class="navbar-text">${title}</span>
                    </div>
                </nav>

                <!-- 메인 콘텐츠 -->
                <div class="content">
                    <div class="ebook-content">
                        ${content}
                    </div>
                </div>
            </body>
            </html>
        `);
    }
}

function editContentInTab(contentId) {
    // 편집 탭으로 이동
    showContentTab('editor');
    
    // 콘텐츠 선택
    document.getElementById('editorContentSelect').value = contentId;
    loadContentForEdit();
}

async function saveContent() {
    try {
        const type = document.getElementById('contentType').value;
        const title = document.getElementById('contentTitle').value;
        const description = document.getElementById('contentDescription').value;
        const price = parseInt(document.getElementById('contentPrice').value);
        const imageUrl = document.getElementById('contentImageUrl').value;
        const contentUrl = document.getElementById('contentUrl').value;
        
        if (!title || !contentUrl) {
            alert('제목과 콘텐츠 URL은 필수입니다.');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('contents')
            .insert({
                title,
                description,
                type,
                price: price || 0,
                image_url: imageUrl,
                content_url: contentUrl,
                status: 'active'
            });
        
        if (error) throw error;
        
        alert('콘텐츠가 추가되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('addContentModal')).hide();
        loadContent();
        
    } catch (error) {
        console.error('콘텐츠 추가 오류:', error);
        alert('콘텐츠 추가에 실패했습니다: ' + error.message);
    }
}

async function toggleContent(contentId, newStatus) {
    try {
        const { error } = await window.supabaseClient
            .from('contents')
            .update({ status: newStatus })
            .eq('id', contentId);
        
        if (error) throw error;
        
        loadContent();
        
    } catch (error) {
        console.error('콘텐츠 상태 변경 오류:', error);
        alert('콘텐츠 상태 변경에 실패했습니다.');
    }
}

async function deleteContent(contentId) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('contents')
            .delete()
            .eq('id', contentId);
        
        if (error) throw error;
        
        loadContent();
        
    } catch (error) {
        console.error('콘텐츠 삭제 오류:', error);
        alert('콘텐츠 삭제에 실패했습니다.');
    }
}

async function editContent(contentId) {
    // 간단한 편집 (실제로는 모달로 구현 가능)
    alert('편집 기능은 추후 구현 예정입니다.');
}

// === 공통 함수 ===
function goToMainPage() {
    window.location.href = '/index.html';
}

async function logout() {
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        
        window.location.href = '/index.html';
        
    } catch (error) {
        console.error('로그아웃 오류:', error);
        alert('로그아웃에 실패했습니다.');
    }
}

// === 후기 관리 ===
async function loadReviews() {
    try {
        console.log('📝 후기 목록 로드 시작...');
        
        const { data: reviews, error } = await window.supabaseClient
            .from('reviews')
            .select(`
                *,
                profiles!user_id (email, full_name),
                products!product_id (title)
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('후기 조회 오류:', error);
            throw error;
        }
        
        console.log('✅ 후기 데이터 로드 완료:', reviews?.length || 0, '개');
        
        // 상품 필터 옵션 업데이트
        const productSelect = document.getElementById('reviewProductFilter');
        const products = [...new Set(reviews.map(r => r.products?.title).filter(Boolean))];
        productSelect.innerHTML = '<option value="">모든 상품</option>' + 
            products.map(title => `<option value="${title}">${title}</option>`).join('');
        
        const tbody = document.getElementById('reviewsTable');
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">후기가 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>${review.products?.title || '삭제된 상품'}</td>
                <td>${review.profiles?.email || '알 수 없음'}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                        <span class="ms-2">${review.rating}/5</span>
                    </div>
                </td>
                <td>
                    <div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${review.comment || '내용 없음'}
                    </div>
                </td>
                <td>${review.created_at ? new Date(review.created_at).toLocaleDateString() : '날짜 없음'}</td>
                <td>
                    <span class="badge ${review.is_visible !== false ? 'bg-success' : 'bg-secondary'}">
                        ${review.is_visible !== false ? '표시' : '숨김'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm ${review.is_visible !== false ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleReviewVisibility('${review.id}', ${review.is_visible !== false})">
                            ${review.is_visible !== false ? '숨기기' : '표시'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReview('${review.id}')">
                            삭제
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('후기 목록 로드 오류:', error);
        const tbody = document.getElementById('reviewsTable');
        tbody.innerHTML = `
            <tr><td colspan="7">
                로드 오류: ${error.message || '알 수 없는 오류'}<br>
                <small>콘솔에서 자세한 오류 내용을 확인하세요.</small>
            </td></tr>
        `;
    }
}

async function filterReviews() {
    const productFilter = document.getElementById('reviewProductFilter').value;
    const statusFilter = document.getElementById('reviewStatusFilter').value;
    
    try {
        let query = window.supabaseClient
            .from('reviews')
            .select(`
                *,
                profiles!user_id (email, full_name),
                products!product_id (title)
            `)
            .order('created_at', { ascending: false });
        
        // 상품 필터 적용
        if (productFilter) {
            query = query.eq('products.title', productFilter);
        }
        
        // 상태 필터 적용
        if (statusFilter === 'visible') {
            query = query.neq('is_visible', false);
        } else if (statusFilter === 'hidden') {
            query = query.eq('is_visible', false);
        }
        
        const { data: reviews, error } = await query;
        
        if (error) throw error;
        
        const tbody = document.getElementById('reviewsTable');
        if (!reviews || reviews.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7">필터 조건에 맞는 후기가 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = reviews.map(review => `
            <tr>
                <td>${review.products?.title || '삭제된 상품'}</td>
                <td>${review.profiles?.email || '알 수 없음'}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                        <span class="ms-2">${review.rating}/5</span>
                    </div>
                </td>
                <td>
                    <div style="max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${review.comment || '내용 없음'}
                    </div>
                </td>
                <td>${review.created_at ? new Date(review.created_at).toLocaleDateString() : '날짜 없음'}</td>
                <td>
                    <span class="badge ${review.is_visible !== false ? 'bg-success' : 'bg-secondary'}">
                        ${review.is_visible !== false ? '표시' : '숨김'}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm ${review.is_visible !== false ? 'btn-warning' : 'btn-success'}" 
                                onclick="toggleReviewVisibility('${review.id}', ${review.is_visible !== false})">
                            ${review.is_visible !== false ? '숨기기' : '표시'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReview('${review.id}')">
                            삭제
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('후기 필터 오류:', error);
        alert('후기 필터링에 실패했습니다: ' + error.message);
    }
}

async function toggleReviewVisibility(reviewId, currentVisibility) {
    try {
        const newVisibility = !currentVisibility;
        
        const { error } = await window.supabaseClient
            .from('reviews')
            .update({ is_visible: newVisibility })
            .eq('id', reviewId);
        
        if (error) throw error;
        
        console.log('후기 표시 상태 변경:', reviewId, '→', newVisibility);
        loadReviews(); // 목록 새로고침
        
    } catch (error) {
        console.error('후기 표시 상태 변경 오류:', error);
        alert('후기 표시 상태 변경에 실패했습니다: ' + error.message);
    }
}

async function deleteReview(reviewId) {
    if (!confirm('정말 이 후기를 삭제하시겠습니까?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('reviews')
            .delete()
            .eq('id', reviewId);
        
        if (error) throw error;
        
        console.log('후기 삭제 완료:', reviewId);
        loadReviews(); // 목록 새로고침
        
    } catch (error) {
        console.error('후기 삭제 오류:', error);
        alert('후기 삭제에 실패했습니다: ' + error.message);
    }
}

// 테이블 존재 확인 함수 제거 (단순화) 