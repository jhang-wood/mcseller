// 관리자 페이지 JavaScript
let handsontables = {};
let currentSection = 'dashboard';
let charts = {};

// Toast 알림 함수
function showToast(message, type = 'info') {
    // 기존 toast 제거
    const existingToast = document.querySelector('.toast-container .toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Toast 컨테이너 생성 (없는 경우)
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Toast 엘리먼트 생성
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

    toastContainer.appendChild(toastEl);

    // Bootstrap Toast 초기화 및 표시
    const toast = new bootstrap.Toast(toastEl, {
        autohide: true,
        delay: 5000
    });
    toast.show();

    // Toast가 숨겨진 후 제거
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPage();
    setupSidebarNavigation();
    setupAdminAuth();
    loadDashboardData();
});

// 관리자 페이지 초기화
async function initializeAdminPage() {
    console.log('🚀 관리자 페이지 초기화 시작');
    
    try {
        // Supabase 클라이언트가 완전히 로드될 때까지 대기
        if (!window.supabaseClient) {
            console.log('⏳ Supabase 클라이언트 로드 대기...');
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
        
        console.log('✅ Supabase 클라이언트 준비 완료');
        
        // 관리자 권한 확인
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) {
            console.log('❌ 관리자 권한 없음 - 초기화 중단');
            return;
        }
        
        console.log('✅ 관리자 권한 확인 완료');
        
        // UI 이벤트 설정
        setupSidebarNavigation();
        setupEventListeners();
        
        // 기본 섹션 표시 (대시보드)
        showSection('dashboard');
        
        console.log('✅ 관리자 페이지 초기화 완료');
        
    } catch (error) {
        console.error('❌ 관리자 페이지 초기화 실패:', error);
        alert('관리자 페이지 초기화 중 오류가 발생했습니다.');
        window.location.href = '/index.html';
    }
}

// 관리자 권한 확인
async function checkAdminAccess() {
    try {
        // Supabase 클라이언트가 준비될 때까지 대기
        if (!window.supabaseClient) {
            console.log('⏳ Supabase 클라이언트 대기 중...');
            await new Promise(resolve => {
                window.addEventListener('supabaseClientReady', resolve, { once: true });
            });
        }
        
        // 세션이 완전히 로드될 때까지 대기 (최대 10초)
        console.log('🔄 세션 로드 대기 중...');
        const session = await window.waitForSession(10000);
        
        if (!session || !session.user) {
            console.log('❌ 로그인되지 않음 - 메인페이지로 리다이렉트');
            alert('로그인이 필요합니다.');
            window.location.href = '/auth.html?redirect=' + encodeURIComponent('/admin.html');
            return false;
        }
        
        console.log('✅ 세션 확인 완료:', session.user.email);
        console.log('🔑 액세스 토큰 있음:', !!session.access_token);
        
        // 사용자 정보 표시
        updateAdminUserInfo(session.user);
        
        // 프로필에서 관리자 권한 확인 (인증 토큰 포함)
        const { data: profile, error: profileError } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        
        if (profileError) {
            console.error('관리자 권한 확인 오류:', profileError);
            
            // 프로필 테이블이 없는 경우 기본 관리자로 처리
            if (profileError.code === 'PGRST116' || profileError.message?.includes('does not exist')) {
                console.log('⚠️ 프로필 테이블이 없음 - 기본 관리자 권한 부여');
                return true;
            }
            
            alert('권한 확인 중 오류가 발생했습니다.');
            window.location.href = '/index.html';
            return false;
        }
        
        if (profile?.role !== 'admin') {
            console.log('❌ 관리자 권한 없음 - 메인페이지로 리다이렉트');
            alert('관리자 권한이 없습니다.');
            window.location.href = '/index.html';
            return false;
        }
        
        console.log('✅ 관리자 권한 확인 완료:', session.user.email);
        return true;
        
    } catch (error) {
        console.error('관리자 접근 권한 확인 오류:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        window.location.href = '/index.html';
        return false;
    }
}

// 사이드바 네비게이션 설정
function setupSidebarNavigation() {
    const navLinks = document.querySelectorAll('#sidebar .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const section = this.getAttribute('data-section');
            if (section) {
                showSection(section);
                
                // 활성 상태 업데이트
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// 섹션 표시
function showSection(sectionName) {
    // 모든 섹션 숨김
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.add('d-none'));
    
    // 선택된 섹션 표시
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.remove('d-none');
        currentSection = sectionName;
        
        // 섹션별 데이터 로드
        loadSectionData(sectionName);
    }
}

// 섹션별 데이터 로드
async function loadSectionData(sectionName) {
    switch (sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'products':
            await loadProductsGrid();
            break;
        case 'orders':
            await loadOrdersGrid();
            break;
        case 'users':
            await loadUsersGrid();
            break;
        case 'reviews':
            await loadReviewsGrid();
            break;
        case 'contents':
            await loadContentsData();
            break;
        case 'analytics':
            await loadAnalyticsData();
            break;
        case 'promotions':
            await loadPromotionsData();
            break;
    }
}

// 대시보드 데이터 로드
async function loadDashboardData() {
    try {
        // 통계 데이터 로드
        const stats = await loadDashboardStats();
        updateStatsCards(stats);
        
        // 차트 데이터 로드
        await loadDashboardCharts();
        
    } catch (error) {
        console.error('대시보드 데이터 로드 오류:', error);
        showToast('대시보드 데이터를 불러올 수 없습니다.', 'error');
    }
}

// 대시보드 통계 로드
async function loadDashboardStats() {
    try {
        // 현재 세션 확인
        const session = await window.getSession();
        if (!session) {
            throw new Error('세션이 없습니다. 다시 로그인해주세요.');
        }
        
        console.log('📊 대시보드 통계 로드 시작...');
        
        // 총 매출 (병렬 처리)
        const [ordersResult, allOrdersResult, productsResult, usersResult] = await Promise.all([
            window.supabaseClient
                .from('orders')
                .select('total_amount')
                .eq('status', 'completed'),
            window.supabaseClient
                .from('orders')
                .select('*', { count: 'exact' }),
            window.supabaseClient
                .from('products')
                .select('*', { count: 'exact' })
                .eq('is_active', true),
            window.supabaseClient
                .from('users')
                .select('*', { count: 'exact' })
        ]);
        
        const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        
        console.log('✅ 대시보드 통계 로드 완료');
        
        return {
            totalRevenue,
            totalOrders: allOrdersResult.count || 0,
            activeProducts: productsResult.count || 0,
            totalUsers: usersResult.count || 0
        };
        
    } catch (error) {
        console.error('통계 데이터 로드 오류:', error);
        
        // 테이블이 없는 경우 기본값 반환
        if (error.message?.includes('does not exist') || error.code === 'PGRST116') {
            showToast('데이터베이스 테이블이 설정되지 않았습니다. 관리자에게 문의하세요.', 'warning');
            return {
                totalRevenue: 0,
                totalOrders: 0,
                activeProducts: 0,
                totalUsers: 0
            };
        }
        
        showToast('통계 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
        return {
            totalRevenue: 0,
            totalOrders: 0,
            activeProducts: 0,
            totalUsers: 0
        };
    }
}

// 통계 카드 업데이트
function updateStatsCards(stats) {
    document.getElementById('total-revenue').textContent = 
        `₩${stats.totalRevenue.toLocaleString()}`;
    document.getElementById('total-orders').textContent = 
        stats.totalOrders.toLocaleString();
    document.getElementById('active-products').textContent = 
        stats.activeProducts.toLocaleString();
    document.getElementById('total-users').textContent = 
        stats.totalUsers.toLocaleString();
}

// 대시보드 차트 로드
async function loadDashboardCharts() {
    try {
        // 매출 추이 차트
        await loadRevenueChart();
        
        // 상품 분포 차트
        await loadProductChart();
        
    } catch (error) {
        console.error('차트 로드 오류:', error);
    }
}

// 매출 추이 차트
async function loadRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    try {
        // 최근 7일 매출 데이터
        const revenueData = await getRevenueData();
        
        if (charts.revenue) {
            charts.revenue.destroy();
        }
        
        charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: '매출',
                    data: revenueData.values,
                    borderColor: '#0d6efd',
                    backgroundColor: 'rgba(13, 110, 253, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₩' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '매출: ₩' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('매출 차트 로드 오류:', error);
    }
}

// 상품 분포 차트
async function loadProductChart() {
    const ctx = document.getElementById('productChart');
    if (!ctx) return;
    
    try {
        const { data: products } = await window.supabaseClient
            .from('products')
            .select('type')
            .eq('is_active', true);
        
        const lectureCount = products?.filter(p => p.type === 'lecture').length || 0;
        const ebookCount = products?.filter(p => p.type === 'ebook').length || 0;
        
        if (charts.product) {
            charts.product.destroy();
        }
        
        charts.product = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['강의', '전자책'],
                datasets: [{
                    data: [lectureCount, ebookCount],
                    backgroundColor: ['#0d6efd', '#ffc107'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('상품 차트 로드 오류:', error);
    }
}

// 매출 데이터 가져오기
async function getRevenueData() {
    const labels = [];
    const values = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        labels.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
        
        try {
            const { data: orders } = await window.supabaseClient
                .from('orders')
                .select('total_amount')
                .eq('status', 'completed')
                .gte('created_at', dateStr + ' 00:00:00')
                .lt('created_at', dateStr + ' 23:59:59');
            
            const dayRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            values.push(dayRevenue);
        } catch (error) {
            console.error(`매출 데이터 조회 오류 (${dateStr}):`, error);
            values.push(0);
        }
    }
    
    return { labels, values };
}

// 상품 그리드 로드
async function loadProductsGrid() {
    try {
        // 현재 세션 확인
        const session = await window.getSession();
        if (!session) {
            showToast('로그인이 필요합니다.', 'error');
            window.location.href = '/auth.html?redirect=' + encodeURIComponent('/admin.html');
            return;
        }
        
        console.log('📦 상품 목록 로드 시작...');
        
        const { data: products, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('상품 로드 오류:', error);
            
            // 테이블이 없는 경우
            if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                showToast('상품 테이블이 설정되지 않았습니다. Supabase SQL Editor에서 데이터베이스 스키마를 실행해주세요.', 'warning');
                document.getElementById('products-grid').innerHTML = `
                    <div class="alert alert-warning">
                        <h5>데이터베이스 설정 필요</h5>
                        <p>상품 테이블이 설정되지 않았습니다. Supabase SQL Editor에서 데이터베이스 스키마를 실행해주세요.</p>
                    </div>
                `;
                return;
            }
            
            throw error;
        }

        console.log('✅ 상품 목록 로드 완료:', products?.length || 0, '개');
        
        const grid = document.getElementById('products-grid');
        if (!grid) {
            console.error('상품 그리드 요소를 찾을 수 없습니다.');
            return;
        }

        if (!products || products.length === 0) {
            grid.innerHTML = `
                <div class="alert alert-info">
                    <h5>상품이 없습니다</h5>
                    <p>새 상품을 추가해보세요.</p>
                    <button class="btn btn-primary" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i> 상품 추가
                    </button>
                </div>
            `;
            return;
        }

        // 상품 카드 생성
        grid.innerHTML = products.map(product => `
            <div class="col-md-6 col-lg-4">
                <div class="card h-100">
                    ${product.image_url ? `
                        <img src="${product.image_url}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    ` : `
                        <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                            <i class="fas fa-image fa-3x text-muted"></i>
                        </div>
                    `}
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description || '설명 없음'}</p>
                        <p class="card-text">
                            <strong>가격: ₩${product.price.toLocaleString()}</strong>
                        </p>
                        <p class="card-text">
                            <small class="text-muted">
                                타입: ${product.type === 'ebook' ? '전자책' : '강의'} | 
                                상태: ${product.is_active ? '활성' : '비활성'}
                            </small>
                        </p>
                    </div>
                    <div class="card-footer">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary btn-sm" onclick="editProduct(${product.id})">
                                <i class="fas fa-edit"></i> 수정
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${product.id})">
                                <i class="fas fa-trash"></i> 삭제
                            </button>
                            <button class="btn btn-outline-info btn-sm" onclick="toggleProductStatus(${product.id}, ${!product.is_active})">
                                <i class="fas fa-toggle-${product.is_active ? 'off' : 'on'}"></i> 
                                ${product.is_active ? '비활성화' : '활성화'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('상품 그리드 로드 오류:', error);
        showToast('상품 목록을 불러오는 중 오류가 발생했습니다.', 'error');
        
        const grid = document.getElementById('products-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="alert alert-danger">
                    <h5>오류 발생</h5>
                    <p>상품 목록을 불러올 수 없습니다: ${error.message}</p>
                    <button class="btn btn-primary" onclick="loadProductsGrid()">
                        <i class="fas fa-refresh"></i> 다시 시도
                    </button>
                </div>
            `;
        }
    }
}

// 상품 추가 모달 표시
function showAddProductModal() {
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    
    // 모달 제목 변경
    document.getElementById('productModalLabel').textContent = '새 상품 추가';
    
    // 폼 초기화
    const form = document.getElementById('productForm');
    form.reset();
    form.dataset.productId = '';
    
    modal.show();
}

// 상품 수정
async function editProduct(productId) {
    try {
        const session = await window.getSession();
        if (!session) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }
        
        const { data: product, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) throw error;

        // 모달에 데이터 채우기
        document.getElementById('productModalLabel').textContent = '상품 수정';
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-type').value = product.type;
        document.getElementById('product-image-url').value = product.image_url || '';
        document.getElementById('product-content-url').value = product.content_url || '';
        document.getElementById('product-active').checked = product.is_active;
        
        // 폼에 상품 ID 저장
        const form = document.getElementById('productForm');
        form.dataset.productId = productId;
        
        // 모달 표시
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();

    } catch (error) {
        console.error('상품 정보 로드 오류:', error);
        showToast('상품 정보를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 상품 저장 (추가/수정)
async function saveProduct() {
    try {
        const session = await window.getSession();
        if (!session) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }
        
        const form = document.getElementById('productForm');
        const productId = form.dataset.productId;
        
        // 폼 데이터 수집
        const productData = {
            name: document.getElementById('product-name').value.trim(),
            description: document.getElementById('product-description').value.trim(),
            price: parseInt(document.getElementById('product-price').value),
            type: document.getElementById('product-type').value,
            image_url: document.getElementById('product-image-url').value.trim() || null,
            content_url: document.getElementById('product-content-url').value.trim() || null,
            is_active: document.getElementById('product-active').checked
        };
        
        // 유효성 검사
        if (!productData.name) {
            showToast('상품명을 입력해주세요.', 'error');
            return;
        }
        
        if (!productData.price || productData.price <= 0) {
            showToast('올바른 가격을 입력해주세요.', 'error');
            return;
        }
        
        console.log('💾 상품 저장 중...', productId ? '수정' : '추가');
        
        let result;
        if (productId) {
            // 수정
            result = await window.supabaseClient
                .from('products')
                .update(productData)
                .eq('id', productId)
                .select();
        } else {
            // 추가
            result = await window.supabaseClient
                .from('products')
                .insert([productData])
                .select();
        }
        
        if (result.error) throw result.error;
        
        console.log('✅ 상품 저장 완료');
        showToast(productId ? '상품이 수정되었습니다.' : '상품이 추가되었습니다.', 'success');
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal.hide();
        
        // 상품 목록 새로고침
        await loadProductsGrid();
        
    } catch (error) {
        console.error('상품 저장 오류:', error);
        showToast('상품 저장 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 상품 삭제
async function deleteProduct(productId) {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const session = await window.getSession();
        if (!session) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }
        
        console.log('🗑️ 상품 삭제 중...', productId);
        
        const { error } = await window.supabaseClient
            .from('products')
            .delete()
            .eq('id', productId);

        if (error) throw error;
        
        console.log('✅ 상품 삭제 완료');
        showToast('상품이 삭제되었습니다.', 'success');
        
        // 상품 목록 새로고침
        await loadProductsGrid();
        
    } catch (error) {
        console.error('상품 삭제 오류:', error);
        showToast('상품 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 상품 상태 토글
async function toggleProductStatus(productId, newStatus) {
    try {
        const session = await window.getSession();
        if (!session) {
            showToast('로그인이 필요합니다.', 'error');
            return;
        }
        
        console.log('🔄 상품 상태 변경 중...', productId, newStatus);
        
        const { error } = await window.supabaseClient
            .from('products')
            .update({ is_active: newStatus })
            .eq('id', productId);

        if (error) throw error;
        
        console.log('✅ 상품 상태 변경 완료');
        showToast(`상품이 ${newStatus ? '활성화' : '비활성화'}되었습니다.`, 'success');
        
        // 상품 목록 새로고침
        await loadProductsGrid();
        
    } catch (error) {
        console.error('상품 상태 변경 오류:', error);
        showToast('상품 상태 변경 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 주문 그리드 로드
async function loadOrdersGrid() {
    const container = document.getElementById('orders-grid');
    if (!container) return;
    
    try {
        const { data: orders, error } = await window.supabaseClient
            .from('orders')
            .select(`
                *,
                users(name, email),
                products(title)
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // 데이터 변환
        const transformedOrders = orders?.map(order => ({
            id: order.id,
            user_name: order.users?.name || '알 수 없음',
            user_email: order.users?.email || '',
            product_title: order.products?.title || '알 수 없음',
            total_amount: order.total_amount,
            status: order.status,
            payment_method: order.payment_method,
            created_at: new Date(order.created_at).toLocaleDateString('ko-KR')
        })) || [];
        
        if (handsontables.orders) {
            handsontables.orders.destroy();
        }
        
        handsontables.orders = new Handsontable(container, {
            data: transformedOrders,
            columns: [
                { data: 'id', title: '주문 ID', readOnly: true, width: 100 },
                { data: 'user_name', title: '구매자', readOnly: true, width: 120 },
                { data: 'user_email', title: '이메일', readOnly: true, width: 180 },
                { data: 'product_title', title: '상품명', readOnly: true, width: 200 },
                { data: 'total_amount', title: '금액', readOnly: true, width: 100 },
                { data: 'status', title: '상태', type: 'dropdown', source: ['pending', 'completed', 'cancelled'], width: 100 },
                { data: 'payment_method', title: '결제수단', readOnly: true, width: 100 },
                { data: 'created_at', title: '주문일', readOnly: true, width: 120 }
            ],
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            filters: true,
            dropdownMenu: true,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            afterChange: function(changes, source) {
                if (source === 'edit') {
                    saveOrderChanges(changes);
                }
            }
        });
        
    } catch (error) {
        console.error('주문 그리드 로드 오류:', error);
        showToast('주문 데이터를 불러올 수 없습니다.', 'error');
    }
}

// 주문 변경사항 저장
async function saveOrderChanges(changes) {
    try {
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;
            const rowData = handsontables.orders.getDataAtRow(row);
            const orderId = rowData[0]; // ID 컬럼
            
            const { error } = await window.supabaseClient
                .from('orders')
                .update({ [prop]: newValue })
                .eq('id', orderId);
            
            if (error) {
                throw error;
            }
        }
        
        showToast('주문 상태가 업데이트되었습니다.', 'success');
    } catch (error) {
        console.error('주문 저장 오류:', error);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 사용자 그리드 로드
async function loadUsersGrid() {
    const container = document.getElementById('users-grid');
    if (!container) return;
    
    try {
        const { data: users, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const transformedUsers = users?.map(user => ({
            ...user,
            created_at: new Date(user.created_at).toLocaleDateString('ko-KR')
        })) || [];
        
        if (handsontables.users) {
            handsontables.users.destroy();
        }
        
        handsontables.users = new Handsontable(container, {
            data: transformedUsers,
            columns: [
                { data: 'id', title: 'ID', readOnly: true, width: 200 },
                { data: 'name', title: '이름', width: 120 },
                { data: 'email', title: '이메일', readOnly: true, width: 200 },
                { data: 'role', title: '역할', type: 'dropdown', source: ['user', 'admin'], width: 100 },
                { data: 'created_at', title: '가입일', readOnly: true, width: 120 }
            ],
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            filters: true,
            dropdownMenu: true,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            afterChange: function(changes, source) {
                if (source === 'edit') {
                    saveUserChanges(changes);
                }
            }
        });
        
    } catch (error) {
        console.error('사용자 그리드 로드 오류:', error);
        showToast('사용자 데이터를 불러올 수 없습니다.', 'error');
    }
}

// 사용자 변경사항 저장
async function saveUserChanges(changes) {
    try {
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;
            const rowData = handsontables.users.getDataAtRow(row);
            const userId = rowData[0]; // ID 컬럼
            
            const { error } = await window.supabaseClient
                .from('users')
                .update({ [prop]: newValue })
                .eq('id', userId);
            
            if (error) {
                throw error;
            }
        }
        
        showToast('사용자 정보가 업데이트되었습니다.', 'success');
    } catch (error) {
        console.error('사용자 저장 오류:', error);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 후기 그리드 로드
async function loadReviewsGrid() {
    const container = document.getElementById('reviews-grid');
    if (!container) return;
    
    try {
        const { data: reviews, error } = await window.supabaseClient
            .from('reviews')
            .select(`
                *,
                users(name, email),
                products(title)
            `)
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        const transformedReviews = reviews?.map(review => ({
            id: review.id,
            user_name: review.users?.name || '알 수 없음',
            product_title: review.products?.title || '알 수 없음',
            rating: review.rating,
            content: review.content,
            is_featured: review.is_featured,
            created_at: new Date(review.created_at).toLocaleDateString('ko-KR')
        })) || [];
        
        if (handsontables.reviews) {
            handsontables.reviews.destroy();
        }
        
        handsontables.reviews = new Handsontable(container, {
            data: transformedReviews,
            columns: [
                { data: 'id', title: 'ID', readOnly: true, width: 80 },
                { data: 'user_name', title: '작성자', readOnly: true, width: 120 },
                { data: 'product_title', title: '상품명', readOnly: true, width: 200 },
                { data: 'rating', title: '평점', readOnly: true, width: 80 },
                { data: 'content', title: '내용', readOnly: true, width: 300 },
                { data: 'is_featured', title: '추천', type: 'checkbox', width: 80 },
                { data: 'created_at', title: '작성일', readOnly: true, width: 120 }
            ],
            rowHeaders: true,
            colHeaders: true,
            contextMenu: true,
            filters: true,
            dropdownMenu: true,
            height: 400,
            licenseKey: 'non-commercial-and-evaluation',
            afterChange: function(changes, source) {
                if (source === 'edit') {
                    saveReviewChanges(changes);
                }
            }
        });
        
    } catch (error) {
        console.error('후기 그리드 로드 오류:', error);
        showToast('후기 데이터를 불러올 수 없습니다.', 'error');
    }
}

// 후기 변경사항 저장
async function saveReviewChanges(changes) {
    try {
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;
            const rowData = handsontables.reviews.getDataAtRow(row);
            const reviewId = rowData[0]; // ID 컬럼
            
            const { error } = await window.supabaseClient
                .from('reviews')
                .update({ [prop]: newValue })
                .eq('id', reviewId);
            
            if (error) {
                throw error;
            }
        }
        
        showToast('후기 설정이 업데이트되었습니다.', 'success');
    } catch (error) {
        console.error('후기 저장 오류:', error);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 분석 데이터 로드
async function loadAnalyticsData() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    
    try {
        // 월별 매출 분석
        const monthlyData = await getMonthlyAnalytics();
        
        if (charts.analytics) {
            charts.analytics.destroy();
        }
        
        charts.analytics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: '월별 매출',
                    data: monthlyData.revenue,
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: '#0d6efd',
                    borderWidth: 1
                }, {
                    label: '월별 주문수',
                    data: monthlyData.orders,
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: '#ffc107',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₩' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: {
                            drawOnChartArea: false,
                        }
                    }
                }
            }
        });
        
    } catch (error) {
        console.error('분석 차트 로드 오류:', error);
    }
}

// 월별 분석 데이터
async function getMonthlyAnalytics() {
    const labels = [];
    const revenue = [];
    const orders = [];
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
        
        labels.push(date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' }));
        
        try {
            // 매출 데이터
            const { data: monthOrders } = await window.supabaseClient
                .from('orders')
                .select('total_amount')
                .eq('status', 'completed')
                .gte('created_at', monthStr + '-01')
                .lt('created_at', getNextMonthFirstDay(date));
            
            const monthRevenue = monthOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
            revenue.push(monthRevenue);
            orders.push(monthOrders?.length || 0);
        } catch (error) {
            console.error(`월별 데이터 조회 오류 (${monthStr}):`, error);
            revenue.push(0);
            orders.push(0);
        }
    }
    
    return { labels, revenue, orders };
}

// 다음 달 첫째 날 계산
function getNextMonthFirstDay(date) {
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth.toISOString().split('T')[0];
}

// 관리자 인증 설정
function setupAdminAuth() {
    // 관리자 로그아웃
    document.getElementById('admin-logout')?.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const success = await signOut();
        if (success) {
            window.location.href = 'index.html';
        }
    });
}

// 상품 추가 모달 설정
document.addEventListener('DOMContentLoaded', function() {
    // 상품 추가 버튼
    document.getElementById('add-product')?.addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('addProductModal'));
        modal.show();
    });
    
    // 상품 유형 변경 시 필드 표시/숨김
    document.getElementById('productType')?.addEventListener('change', function() {
        const type = this.value;
        const lectureFields = document.getElementById('lectureFields');
        const ebookFields = document.getElementById('ebookFields');
        
        if (type === 'lecture') {
            lectureFields.style.display = 'block';
            ebookFields.style.display = 'none';
        } else if (type === 'ebook') {
            lectureFields.style.display = 'none';
            ebookFields.style.display = 'block';
        } else {
            lectureFields.style.display = 'none';
            ebookFields.style.display = 'none';
        }
    });
    
    // 상품 저장
    document.getElementById('saveProduct')?.addEventListener('click', saveNewProduct);
    
    // CSV 가져오기
    document.getElementById('import-csv')?.addEventListener('click', function() {
        const modal = new bootstrap.Modal(document.getElementById('csvImportModal'));
        modal.show();
    });
    
    // CSV 내보내기
    document.getElementById('export-csv')?.addEventListener('click', exportProductsCSV);
    
    // CSV 파일 가져오기
    document.getElementById('importCsv')?.addEventListener('click', importProductsCSV);
});

// ===== 콘텐츠 관리 함수들 =====

// 콘텐츠 관리 로드
async function loadContentsData() {
    await loadEbooksList();
    await loadCoursesList();
}

// 전자책 목록 로드
async function loadEbooksList() {
    const container = document.getElementById('ebooks-list');
    if (!container) return;

    // 테스트용 전자책 데이터 (실제로는 DB에서 가져옴)
    const ebooks = [
        {
            id: 'ebook1',
            title: '온라인 수익화 전략서 1탄',
            chapters: 3,
            status: 'active',
            created: '2025-06-28'
        },
        {
            id: 'ebook2',
            title: '실전 수익화 가이드북 2탄',
            chapters: 2,
            status: 'active',
            created: '2025-06-28'
        }
    ];

    container.innerHTML = ebooks.map(ebook => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5 class="card-title">${ebook.title}</h5>
                        <p class="card-text text-muted">
                            <i class="fas fa-file-alt me-2"></i>${ebook.chapters}개 챕터
                            <span class="mx-2">•</span>
                            <span class="badge bg-${ebook.status === 'active' ? 'success' : 'secondary'}">${ebook.status === 'active' ? '활성' : '비활성'}</span>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-outline-primary btn-sm me-2" onclick="editEbook('${ebook.id}')">
                            <i class="fas fa-edit"></i> 편집
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="manageEbookChapters('${ebook.id}')">
                            <i class="fas fa-list"></i> 챕터 관리
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 강의 목록 로드
async function loadCoursesList() {
    const container = document.getElementById('courses-list');
    if (!container) return;

    // 테스트용 강의 데이터
    const courses = [
        {
            id: 'ai-master',
            title: 'AI 마스터 실전 과정',
            lessons: 4,
            duration: '2시간 30분',
            status: 'active',
            created: '2025-06-28'
        }
    ];

    container.innerHTML = courses.map(course => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h5 class="card-title">${course.title}</h5>
                        <p class="card-text text-muted">
                            <i class="fas fa-play-circle me-2"></i>${course.lessons}개 강의
                            <span class="mx-2">•</span>
                            <i class="fas fa-clock me-1"></i>${course.duration}
                            <span class="mx-2">•</span>
                            <span class="badge bg-${course.status === 'active' ? 'success' : 'secondary'}">${course.status === 'active' ? '활성' : '비활성'}</span>
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-outline-primary btn-sm me-2" onclick="editCourse('${course.id}')">
                            <i class="fas fa-edit"></i> 편집
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="manageLessons('${course.id}')">
                            <i class="fas fa-list"></i> 강의 관리
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// 새 전자책 추가
function addEbook() {
    const title = prompt('전자책 제목을 입력하세요:');
    if (!title) return;

    const ebookId = 'ebook' + Date.now();
    
    // 여기서 실제로는 DB에 저장
    alert(`전자책 "${title}"이 추가되었습니다.\nID: ${ebookId}`);
    loadEbooksList();
}

// 새 강의 추가
function addCourse() {
    const title = prompt('강의 제목을 입력하세요:');
    if (!title) return;

    const courseId = 'course' + Date.now();
    
    // 여기서 실제로는 DB에 저장
    alert(`강의 "${title}"이 추가되었습니다.\nID: ${courseId}`);
    loadCoursesList();
}

// 전자책 편집
function editEbook(ebookId) {
    // 전자책 편집 모달을 여는 함수
    showEbookEditModal(ebookId);
}

// 강의 편집
function editCourse(courseId) {
    // 강의 편집 모달을 여는 함수
    showCourseEditModal(courseId);
}

// 전자책 챕터 관리
function manageEbookChapters(ebookId) {
    // 챕터 관리 모달을 여는 함수
    showChapterManageModal(ebookId);
}

// 강의 레슨 관리
function manageLessons(courseId) {
    // 레슨 관리 모달을 여는 함수
    showLessonManageModal(courseId);
}

// 전자책 편집 모달 표시
function showEbookEditModal(ebookId) {
    const modalHtml = `
        <div class="modal fade" id="ebookEditModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">전자책 편집</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="ebookEditForm">
                            <div class="mb-3">
                                <label class="form-label">제목</label>
                                <input type="text" class="form-control" id="ebookTitle" value="온라인 수익화 전략서 1탁">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">설명</label>
                                <textarea class="form-control" id="ebookDescription" rows="3">전자책 설명을 입력하세요</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">상태</label>
                                <select class="form-select" id="ebookStatus">
                                    <option value="active">활성</option>
                                    <option value="inactive">비활성</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-primary" onclick="saveEbookChanges('${ebookId}')">저장</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 기존 모달 제거 후 새로 추가
    document.getElementById('ebookEditModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('ebookEditModal'));
    modal.show();
}

// 강의 편집 모달 표시
function showCourseEditModal(courseId) {
    const modalHtml = `
        <div class="modal fade" id="courseEditModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">강의 편집</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="courseEditForm">
                            <div class="mb-3">
                                <label class="form-label">강의 제목</label>
                                <input type="text" class="form-control" id="courseTitle" value="AI 마스터 실전 과정">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">강의 설명</label>
                                <textarea class="form-control" id="courseDescription" rows="3">강의 설명을 입력하세요</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">상태</label>
                                <select class="form-select" id="courseStatus">
                                    <option value="active">활성</option>
                                    <option value="inactive">비활성</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                        <button type="button" class="btn btn-primary" onclick="saveCourseChanges('${courseId}')">저장</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('courseEditModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('courseEditModal'));
    modal.show();
}

// 전자책 변경사항 저장
function saveEbookChanges(ebookId) {
    const title = document.getElementById('ebookTitle').value;
    const description = document.getElementById('ebookDescription').value;
    const status = document.getElementById('ebookStatus').value;
    
    // 여기서 실제로는 DB에 저장
    alert(`전자책이 업데이트되었습니다:\n제목: ${title}\n상태: ${status}`);
    
    bootstrap.Modal.getInstance(document.getElementById('ebookEditModal')).hide();
    loadEbooksList();
}

// 강의 변경사항 저장
function saveCourseChanges(courseId) {
    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;
    const status = document.getElementById('courseStatus').value;
    
    // 여기서 실제로는 DB에 저장
    alert(`강의가 업데이트되었습니다:\n제목: ${title}\n상태: ${status}`);
    
    bootstrap.Modal.getInstance(document.getElementById('courseEditModal')).hide();
    loadCoursesList();
}

// 새 상품 저장
async function saveNewProduct() {
    const form = document.getElementById('addProductForm');
    const formData = new FormData(form);
    
    const productData = {
        title: document.getElementById('productTitle').value,
        description: document.getElementById('productDescription').value,
        type: document.getElementById('productType').value,
        price: parseFloat(document.getElementById('productPrice').value),
        image_url: document.getElementById('productImage').value,
        is_active: document.getElementById('productActive').checked,
        created_at: new Date().toISOString()
    };
    
    // 타입별 추가 필드
    if (productData.type === 'lecture') {
        productData.youtube_url = document.getElementById('youtubeUrl').value;
    } else if (productData.type === 'ebook') {
        productData.content_url = document.getElementById('contentUrl').value;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('products')
            .insert([productData]);
        
        if (error) {
            throw error;
        }
        
        showToast('상품이 추가되었습니다.', 'success');
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('addProductModal'));
        modal.hide();
        
        // 폼 초기화
        form.reset();
        
        // 그리드 새로고침
        if (currentSection === 'products') {
            loadProductsGrid();
        }
        
    } catch (error) {
        console.error('상품 추가 오류:', error);
        showToast('상품 추가 중 오류가 발생했습니다.', 'error');
    }
}

// CSV 내보내기
async function exportProductsCSV() {
    try {
        const { data: products, error } = await window.supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        if (!products || products.length === 0) {
            showToast('내보낼 데이터가 없습니다.', 'warning');
            return;
        }
        
        // CSV 생성
        const headers = ['제목', '설명', '유형', '가격', '이미지URL', '콘텐츠URL', '활성화'];
        const csvContent = [
            headers.join(','),
            ...products.map(product => [
                `"${product.title}"`,
                `"${product.description}"`,
                product.type,
                product.price,
                `"${product.image_url || ''}"`,
                `"${product.youtube_url || product.content_url || ''}"`,
                product.is_active
            ].join(','))
        ].join('\n');
        
        // 파일 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showToast('CSV 파일이 다운로드되었습니다.', 'success');
        
    } catch (error) {
        console.error('CSV 내보내기 오류:', error);
        showToast('CSV 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

// CSV 가져오기
async function importProductsCSV() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showToast('CSV 파일을 선택해주세요.', 'warning');
        return;
    }
    
    try {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',');
        
        const products = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 7) {
                products.push({
                    title: values[0].replace(/"/g, ''),
                    description: values[1].replace(/"/g, ''),
                    type: values[2],
                    price: parseFloat(values[3]),
                    image_url: values[4].replace(/"/g, ''),
                    youtube_url: values[2] === 'lecture' ? values[5].replace(/"/g, '') : null,
                    content_url: values[2] === 'ebook' ? values[5].replace(/"/g, '') : null,
                    is_active: values[6] === 'true',
                    created_at: new Date().toISOString()
                });
            }
        }
        
        if (products.length === 0) {
            showToast('유효한 데이터가 없습니다.', 'warning');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('products')
            .insert(products);
        
        if (error) {
            throw error;
        }
        
        showToast(`${products.length}개의 상품이 추가되었습니다.`, 'success');
        
        // 모달 닫기
        const modal = bootstrap.Modal.getInstance(document.getElementById('csvImportModal'));
        modal.hide();
        
        // 그리드 새로고침
        if (currentSection === 'products') {
            loadProductsGrid();
        }
        
    } catch (error) {
        console.error('CSV 가져오기 오류:', error);
        showToast('CSV 가져오기 중 오류가 발생했습니다.', 'error');
    }
}

// 프로모션 관리 기능 추가
async function loadPromotionsData() {
    try {
        // 신규 회원 적립금 설정 로드
        await loadNewUserPointsSetting();
        
        // 할인 코드 목록 로드
        await loadDiscountCodes();
        
        // 프로모션 현황 테이블 로드
        await loadPromotionsTable();
        
        // 이벤트 리스너 설정
        setupPromotionEvents();
        
    } catch (error) {
        console.error('프로모션 데이터 로드 오류:', error);
        showToast('프로모션 데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 신규 회원 적립금 설정 로드
async function loadNewUserPointsSetting() {
    try {
        // localStorage에서 설정 불러오기 (실제로는 DB에서)
        const savedPoints = localStorage.getItem('newUserPoints') || '31500';
        document.getElementById('newUserPoints').value = savedPoints;
    } catch (error) {
        console.error('적립금 설정 로드 오류:', error);
    }
}

// 할인 코드 목록 로드
async function loadDiscountCodes() {
    try {
        // localStorage에서 할인 코드 불러오기 (실제로는 DB에서)
        const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        
        const container = document.getElementById('discountCodesContainer');
        if (discountCodes.length === 0) {
            container.innerHTML = '<p class="text-muted">등록된 할인 코드가 없습니다.</p>';
            return;
        }
        
        let html = '';
        discountCodes.forEach((code, index) => {
            const typeText = code.type === 'percent' ? `${code.value}% 할인` : `${code.value.toLocaleString()}원 할인`;
            const statusBadge = code.isActive ? 
                '<span class="badge bg-success">활성</span>' : 
                '<span class="badge bg-secondary">비활성</span>';
            
            html += `
                <div class="d-flex justify-content-between align-items-center p-2 border rounded mb-2">
                    <div>
                        <strong>${code.code}</strong> - ${typeText}
                        <br><small class="text-muted">사용: ${code.usedCount || 0}/${code.maxUses}회</small>
                    </div>
                    <div>
                        ${statusBadge}
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteDiscountCode(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    } catch (error) {
        console.error('할인 코드 로드 오류:', error);
    }
}

// 프로모션 현황 테이블 로드
async function loadPromotionsTable() {
    try {
        const newUserPoints = localStorage.getItem('newUserPoints') || '31500';
        const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        
        const tbody = document.getElementById('promotionsTableBody');
        let html = '';
        
        // 신규 회원 적립금 행 추가
        html += `
            <tr>
                <td>신규 회원 적립금</td>
                <td>자동 지급</td>
                <td>${parseInt(newUserPoints).toLocaleString()}원</td>
                <td>-</td>
                <td><span class="badge bg-success">활성</span></td>
                <td>-</td>
            </tr>
        `;
        
        // 할인 코드 행들 추가
        discountCodes.forEach((code, index) => {
            const typeText = code.type === 'percent' ? `${code.value}%` : `${code.value.toLocaleString()}원`;
            const statusBadge = code.isActive ? 
                '<span class="badge bg-success">활성</span>' : 
                '<span class="badge bg-secondary">비활성</span>';
            
            html += `
                <tr>
                    <td>할인 코드</td>
                    <td>${code.code}</td>
                    <td>${typeText}</td>
                    <td>${code.usedCount || 0}/${code.maxUses}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteDiscountCode(${index})">
                            삭제
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    } catch (error) {
        console.error('프로모션 테이블 로드 오류:', error);
    }
}

// 프로모션 이벤트 설정
function setupPromotionEvents() {
    // 신규 회원 적립금 저장
    document.getElementById('saveNewUserPoints').addEventListener('click', async function() {
        const points = document.getElementById('newUserPoints').value;
        if (points && parseInt(points) >= 0) {
            localStorage.setItem('newUserPoints', points);
            showToast('신규 회원 적립금이 저장되었습니다.', 'success');
            await loadPromotionsTable();
        } else {
            showToast('올바른 적립금을 입력해주세요.', 'error');
        }
    });
    
    // 할인 코드 저장
    document.getElementById('saveDiscountCode').addEventListener('click', async function() {
        const form = document.getElementById('addDiscountCodeForm');
        const formData = new FormData(form);
        
        const discountData = {
            code: document.getElementById('discountCode').value.toUpperCase(),
            type: document.getElementById('discountType').value,
            value: parseInt(document.getElementById('discountValue').value),
            maxUses: parseInt(document.getElementById('maxUses').value),
            expiryDate: document.getElementById('expiryDate').value,
            isActive: document.getElementById('isActive').checked,
            usedCount: 0,
            createdAt: new Date().toISOString()
        };
        
        // 유효성 검사
        if (!discountData.code || !discountData.type || !discountData.value || !discountData.maxUses) {
            showToast('모든 필수 항목을 입력해주세요.', 'error');
            return;
        }
        
        if (discountData.type === 'percent' && (discountData.value < 1 || discountData.value > 99)) {
            showToast('할인율은 1-99% 사이여야 합니다.', 'error');
            return;
        }
        
        if (discountData.type === 'amount' && discountData.value < 1000) {
            showToast('할인금액은 최소 1000원 이상이어야 합니다.', 'error');
            return;
        }
        
        // 기존 할인 코드와 중복 확인
        const existingCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
        if (existingCodes.some(code => code.code === discountData.code)) {
            showToast('이미 존재하는 할인 코드입니다.', 'error');
            return;
        }
        
        // 할인 코드 저장
        existingCodes.push(discountData);
        localStorage.setItem('discountCodes', JSON.stringify(existingCodes));
        
        // 모달 닫기 및 새로고침
        const modal = bootstrap.Modal.getInstance(document.getElementById('addDiscountCodeModal'));
        modal.hide();
        form.reset();
        
        showToast('할인 코드가 추가되었습니다.', 'success');
        await loadDiscountCodes();
        await loadPromotionsTable();
    });
    
    // 할인 유형 변경시 도움말 업데이트
    document.getElementById('discountType').addEventListener('change', function() {
        const type = this.value;
        const helpText = document.getElementById('discountValueHelp');
        const valueInput = document.getElementById('discountValue');
        
        if (type === 'percent') {
            helpText.textContent = '1-99 사이의 할인율을 입력하세요';
            valueInput.setAttribute('max', '99');
            valueInput.setAttribute('min', '1');
        } else if (type === 'amount') {
            helpText.textContent = '최소 1000원 이상의 할인금액을 입력하세요';
            valueInput.setAttribute('min', '1000');
            valueInput.removeAttribute('max');
        }
    });
}

// 할인 코드 삭제
async function deleteDiscountCode(index) {
    if (confirm('정말로 이 할인 코드를 삭제하시겠습니까?')) {
        try {
            const discountCodes = JSON.parse(localStorage.getItem('discountCodes') || '[]');
            discountCodes.splice(index, 1);
            localStorage.setItem('discountCodes', JSON.stringify(discountCodes));
            
            showToast('할인 코드가 삭제되었습니다.', 'success');
            await loadDiscountCodes();
            await loadPromotionsTable();
        } catch (error) {
            console.error('할인 코드 삭제 오류:', error);
            showToast('할인 코드 삭제 중 오류가 발생했습니다.', 'error');
        }
    }
}

// 사용자 정보 표시
function updateAdminUserInfo(user) {
    try {
        // 관리자 이름 표시 (이메일에서 @ 앞부분 사용)
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            const displayName = user.user_metadata?.full_name || 
                               user.email?.split('@')[0] || 
                               '관리자';
            adminNameElement.textContent = displayName;
        }
        
        console.log('✅ 관리자 정보 표시 완료:', user.email);
    } catch (error) {
        console.error('관리자 정보 표시 오류:', error);
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await window.signOut();
                window.location.href = '/index.html';
            } catch (error) {
                console.error('로그아웃 오류:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        });
    }
    
    // 새로고침 버튼들
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-action="refresh"]')) {
            const section = e.target.dataset.section;
            if (section) {
                loadSectionData(section);
            }
        }
    });
}
