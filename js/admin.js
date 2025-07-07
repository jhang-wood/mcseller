// MCSELLER 관리자 페이지 - 단순 기능 중심 v2.0
console.log('🚀 관리자 페이지 JavaScript v2.0 로드됨');

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
        }
    }
}

// === 회원관리 ===
async function loadAllUsers() {
    try {
        const { data: profiles, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('usersTable');
        if (!profiles || profiles.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">회원이 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = profiles.map(user => `
            <tr>
                <td>${user.email}</td>
                <td>${user.full_name || '미설정'}</td>
                <td>
                    <select class="form-control form-control-sm" onchange="updateUserRole('${user.id}', this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>일반회원</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                    </select>
                </td>
                <td>${(user.points || 0).toLocaleString()}원</td>
                <td>${new Date(user.updated_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editUserPoints('${user.id}', ${user.points || 0})">
                        적립금 수정
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('회원 목록 로드 오류:', error);
        document.getElementById('usersTable').innerHTML = '<tr><td colspan="6">로드 오류</td></tr>';
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
                <td>${new Date(user.updated_at).toLocaleDateString()}</td>
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
        if (!(await checkTableExists('coupons'))) {
            alert('쿠폰 테이블이 존재하지 않습니다. 관리자에게 문의하세요.');
            return;
        }
        
        const { data: coupons, error } = await window.supabaseClient
            .from('coupons')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('couponsTable');
        if (!coupons || coupons.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">쿠폰이 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = coupons.map(coupon => `
            <tr>
                <td><strong>${coupon.code}</strong></td>
                <td>
                    ${coupon.discount_type === 'percent' ? 
                        `${coupon.discount_value}%` : 
                        `${coupon.discount_value.toLocaleString()}원`}
                </td>
                <td>${coupon.used_count || 0} / ${coupon.max_uses}</td>
                <td>${new Date(coupon.expiry_date).toLocaleDateString()}</td>
                <td>
                    <span class="badge bg-${coupon.is_active ? 'success' : 'secondary'}">
                        ${coupon.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning me-1" onclick="toggleCoupon('${coupon.id}', ${!coupon.is_active})">
                        ${coupon.is_active ? '비활성화' : '활성화'}
                    </button>
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
    try {
        const { error } = await window.supabaseClient.rpc('create_coupons_table');
        // 테이블이 이미 존재하면 오류 무시
    } catch (error) {
        // 테이블 수동 생성 시도
        console.log('쿠폰 테이블 확인 중...');
    }
}

function showAddCouponModal() {
    const modal = new bootstrap.Modal(document.getElementById('addCouponModal'));
    document.getElementById('couponForm').reset();
    modal.show();
}

async function saveCoupon() {
    try {
        const code = document.getElementById('couponCode').value;
        const discountType = document.getElementById('discountType').value;
        const discountValue = parseInt(document.getElementById('discountValue').value);
        const maxUses = parseInt(document.getElementById('maxUses').value);
        const expiryDate = document.getElementById('expiryDate').value;
        
        if (!code || !discountValue || !expiryDate) {
            alert('모든 필드를 입력해주세요.');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('coupons')
            .insert({
                code: code.toUpperCase(),
                discount_type: discountType,
                discount_value: discountValue,
                max_uses: maxUses,
                expiry_date: expiryDate,
                is_active: true,
                used_count: 0
            });
        
        if (error) throw error;
        
        alert('쿠폰이 생성되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('addCouponModal')).hide();
        loadCoupons();
        
    } catch (error) {
        console.error('쿠폰 생성 오류:', error);
        alert('쿠폰 생성에 실패했습니다.');
    }
}

async function toggleCoupon(couponId, isActive) {
    try {
        const { error } = await window.supabaseClient
            .from('coupons')
            .update({ is_active: isActive })
            .eq('id', couponId);
        
        if (error) throw error;
        
        loadCoupons();
        
    } catch (error) {
        console.error('쿠폰 상태 변경 오류:', error);
        alert('쿠폰 상태 변경에 실패했습니다.');
    }
}

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
        const { data: user, error: getUserError } = await window.supabaseClient
            .from('profiles')
            .select('points')
            .eq('email', email)
            .single();
        
        if (getUserError) throw getUserError;
        
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
async function loadContent() {
    try {
        await ensureContentTable();
        
        const { data: contents, error } = await window.supabaseClient
            .from('contents')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        
        const tbody = document.getElementById('contentTable');
        if (!contents || contents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">콘텐츠가 없습니다.</td></tr>';
            return;
        }
        
        tbody.innerHTML = contents.map(content => `
            <tr>
                <td><strong>${content.title}</strong></td>
                <td>
                    <span class="badge bg-${content.type === 'ebook' ? 'info' : 'success'}">
                        ${content.type === 'ebook' ? '전자책' : '강의'}
                    </span>
                </td>
                <td>${content.price.toLocaleString()}원</td>
                <td>
                    <span class="badge bg-${content.is_active ? 'success' : 'secondary'}">
                        ${content.is_active ? '활성' : '비활성'}
                    </span>
                </td>
                <td>${new Date(content.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editContent('${content.id}')">수정</button>
                    <button class="btn btn-sm btn-warning me-1" onclick="toggleContent('${content.id}', ${!content.is_active})">
                        ${content.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteContent('${content.id}')">삭제</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('콘텐츠 목록 로드 오류:', error);
        document.getElementById('contentTable').innerHTML = '<tr><td colspan="6">로드 오류</td></tr>';
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

async function saveContent() {
    try {
        const type = document.getElementById('contentType').value;
        const title = document.getElementById('contentTitle').value;
        const description = document.getElementById('contentDescription').value;
        const price = parseInt(document.getElementById('contentPrice').value);
        const imageUrl = document.getElementById('contentImageUrl').value;
        const contentUrl = document.getElementById('contentUrl').value;
        
        if (!title || !price || !contentUrl) {
            alert('필수 필드를 입력해주세요.');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('contents')
            .insert({
                title,
                description,
                type,
                price,
                image_url: imageUrl,
                content_url: contentUrl,
                is_active: true
            });
        
        if (error) throw error;
        
        alert('콘텐츠가 추가되었습니다.');
        bootstrap.Modal.getInstance(document.getElementById('addContentModal')).hide();
        loadContent();
        
    } catch (error) {
        console.error('콘텐츠 추가 오류:', error);
        alert('콘텐츠 추가에 실패했습니다.');
    }
}

async function toggleContent(contentId, isActive) {
    try {
        const { error } = await window.supabaseClient
            .from('contents')
            .update({ is_active: isActive })
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

async function checkTableExists(tableName) {
    const { data, error } = await supabase.rpc('check_table_exists', { table_name: tableName });
    return !error && data;
} 