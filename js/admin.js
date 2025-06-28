// 관리자 페이지 JavaScript
let handsontables = {};
let currentSection = 'dashboard';
let charts = {};

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPage();
    setupSidebarNavigation();
    setupAdminAuth();
    loadDashboardData();
});

// 관리자 페이지 초기화
async function initializeAdminPage() {
    // 관리자 권한 확인
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) {
        window.location.href = 'index.html';
        return;
    }
    
    // 사용자 정보 표시
    const user = await getCurrentUser();
    if (user) {
        document.getElementById('admin-name').textContent = user.email;
    }
    
    // 초기 섹션 로드
    showSection('dashboard');
}

// 관리자 권한 확인
async function checkAdminAccess() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return false;
        }
        
        const { data, error } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
        
        if (error) {
            console.error('관리자 권한 확인 오류:', error);
            return false;
        }
        
        return data?.role === 'admin';
    } catch (error) {
        console.error('관리자 접근 권한 확인 오류:', error);
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
        case 'analytics':
            await loadAnalyticsData();
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
        // 총 매출
        const { data: orders } = await supabaseClient
            .from('orders')
            .select('total_amount')
            .eq('status', 'completed');
        
        const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
        
        // 총 주문
        const { data: allOrders, count: totalOrders } = await supabaseClient
            .from('orders')
            .select('*', { count: 'exact' });
        
        // 활성 상품
        const { data: products, count: activeProducts } = await supabaseClient
            .from('products')
            .select('*', { count: 'exact' })
            .eq('is_active', true);
        
        // 총 회원
        const { data: users, count: totalUsers } = await supabaseClient
            .from('users')
            .select('*', { count: 'exact' });
        
        return {
            totalRevenue,
            totalOrders: totalOrders || 0,
            activeProducts: activeProducts || 0,
            totalUsers: totalUsers || 0
        };
        
    } catch (error) {
        console.error('통계 데이터 로드 오류:', error);
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
        const { data: products } = await supabaseClient
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
            const { data: orders } = await supabaseClient
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
    const container = document.getElementById('products-grid');
    if (!container) return;
    
    try {
        const { data: products, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            throw error;
        }
        
        // Handsontable 초기화
        if (handsontables.products) {
            handsontables.products.destroy();
        }
        
        handsontables.products = new Handsontable(container, {
            data: products || [],
            columns: [
                { data: 'id', title: 'ID', readOnly: true, width: 80 },
                { data: 'title', title: '제목', width: 200 },
                { data: 'description', title: '설명', width: 300 },
                { data: 'type', title: '유형', type: 'dropdown', source: ['lecture', 'ebook'], width: 100 },
                { data: 'price', title: '가격', type: 'numeric', width: 100 },
                { data: 'is_active', title: '활성화', type: 'checkbox', width: 80 },
                { data: 'created_at', title: '생성일', readOnly: true, width: 120 }
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
                    saveProductChanges(changes);
                }
            }
        });
        
    } catch (error) {
        console.error('상품 그리드 로드 오류:', error);
        showToast('상품 데이터를 불러올 수 없습니다.', 'error');
    }
}

// 상품 변경사항 저장
async function saveProductChanges(changes) {
    try {
        for (const change of changes) {
            const [row, prop, oldValue, newValue] = change;
            const rowData = handsontables.products.getDataAtRow(row);
            const productId = rowData[0]; // ID 컬럼
            
            const { error } = await supabaseClient
                .from('products')
                .update({ [prop]: newValue })
                .eq('id', productId);
            
            if (error) {
                throw error;
            }
        }
        
        showToast('변경사항이 저장되었습니다.', 'success');
    } catch (error) {
        console.error('상품 저장 오류:', error);
        showToast('저장 중 오류가 발생했습니다.', 'error');
    }
}

// 주문 그리드 로드
async function loadOrdersGrid() {
    const container = document.getElementById('orders-grid');
    if (!container) return;
    
    try {
        const { data: orders, error } = await supabaseClient
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
            
            const { error } = await supabaseClient
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
        const { data: users, error } = await supabaseClient
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
            
            const { error } = await supabaseClient
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
        const { data: reviews, error } = await supabaseClient
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
            
            const { error } = await supabaseClient
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
            const { data: monthOrders } = await supabaseClient
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
        const { error } = await supabaseClient
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
        const { data: products, error } = await supabaseClient
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
        
        const { error } = await supabaseClient
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
