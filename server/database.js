// 데이터베이스 연결 및 관리
const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Supabase 클라이언트 생성 (서버사이드용)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// 데이터베이스 연결 테스트
async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('count(*)')
            .limit(1);
        
        if (error) {
            throw error;
        }
        
        console.log('✅ Supabase 데이터베이스 연결 성공');
        return true;
    } catch (error) {
        console.error('❌ 데이터베이스 연결 실패:', error.message);
        return false;
    }
}

// 상품 관련 데이터베이스 함수들
const ProductService = {
    // 모든 활성 상품 조회
    async getAllActive(type = null) {
        try {
            let query = supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            
            if (type) {
                query = query.eq('type', type);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('상품 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 상품 ID로 조회
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('상품 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 새 상품 생성
    async create(productData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    ...productData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('상품 생성 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 상품 업데이트
    async update(id, updateData) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('상품 업데이트 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 상품 삭제 (soft delete)
    async delete(id) {
        try {
            const { data, error } = await supabase
                .from('products')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('상품 삭제 오류:', error);
            return { success: false, error: error.message };
        }
    }
};

// 사용자 관련 데이터베이스 함수들
const UserService = {
    // 사용자 정보 조회
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('사용자 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 사용자 생성/업데이트
    async upsert(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .upsert([{
                    ...userData,
                    updated_at: new Date().toISOString()
                }], {
                    onConflict: 'id'
                })
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('사용자 저장 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 관리자 권한 확인
    async isAdmin(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return { success: true, isAdmin: data?.role === 'admin' };
        } catch (error) {
            console.error('관리자 권한 확인 오류:', error);
            return { success: false, isAdmin: false };
        }
    }
};

// 주문 관련 데이터베이스 함수들
const OrderService = {
    // 주문 생성
    async create(orderData) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([{
                    ...orderData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('주문 생성 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 주문 상태 업데이트
    async updateStatus(orderId, status, additionalData = {}) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .update({
                    status,
                    ...additionalData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('주문 상태 업데이트 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 사용자별 주문 내역 조회
    async getByUser(userId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    products (
                        title,
                        type,
                        image_url
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('주문 내역 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 주문 ID로 조회
    async getById(orderId) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    users (name, email),
                    products (title, type, price)
                `)
                .eq('id', orderId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('주문 조회 오류:', error);
            return { success: false, error: error.message };
        }
    }
};

// 접근 권한 관련 데이터베이스 함수들
const AccessService = {
    // 접근 권한 부여
    async grant(userId, productId) {
        try {
            const { data, error } = await supabase
                .from('access_rights')
                .upsert([{
                    user_id: userId,
                    product_id: productId,
                    granted_at: new Date().toISOString()
                }], {
                    onConflict: 'user_id,product_id'
                })
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('접근 권한 부여 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 접근 권한 확인
    async check(userId, productId) {
        try {
            const { data, error } = await supabase
                .from('access_rights')
                .select('*')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .single();
            
            if (error && error.code !== 'PGRST116') throw error;
            return { success: true, hasAccess: !!data };
        } catch (error) {
            console.error('접근 권한 확인 오류:', error);
            return { success: false, hasAccess: false };
        }
    },
    
    // 사용자의 모든 접근 권한 조회
    async getUserAccess(userId) {
        try {
            const { data, error } = await supabase
                .from('access_rights')
                .select(`
                    *,
                    products (
                        id,
                        title,
                        type,
                        image_url,
                        price
                    )
                `)
                .eq('user_id', userId)
                .order('granted_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('사용자 접근 권한 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 접근 권한 제거
    async revoke(userId, productId) {
        try {
            const { data, error } = await supabase
                .from('access_rights')
                .delete()
                .eq('user_id', userId)
                .eq('product_id', productId)
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('접근 권한 제거 오류:', error);
            return { success: false, error: error.message };
        }
    }
};

// 후기 관련 데이터베이스 함수들
const ReviewService = {
    // 후기 생성
    async create(reviewData) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert([{
                    ...reviewData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('후기 생성 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 상품별 후기 조회
    async getByProduct(productId, limit = 10) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    users (name)
                `)
                .eq('product_id', productId)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('후기 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 후기 업데이트
    async update(reviewId, updateData) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('후기 업데이트 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 추천 후기 조회
    async getFeatured(limit = 5) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    users (name),
                    products (title, type)
                `)
                .eq('is_featured', true)
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('추천 후기 조회 오류:', error);
            return { success: false, error: error.message };
        }
    }
};

// 통계 관련 데이터베이스 함수들
const AnalyticsService = {
    // 매출 통계
    async getRevenue(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('total_amount, created_at')
                .eq('status', 'completed')
                .gte('created_at', startDate)
                .lte('created_at', endDate);
            
            if (error) throw error;
            
            const totalRevenue = data.reduce((sum, order) => sum + order.total_amount, 0);
            const orderCount = data.length;
            
            return { 
                success: true, 
                data: { 
                    totalRevenue, 
                    orderCount, 
                    orders: data 
                } 
            };
        } catch (error) {
            console.error('매출 통계 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 상품별 판매 통계
    async getProductSales() {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    product_id,
                    total_amount,
                    products (title, type)
                `)
                .eq('status', 'completed');
            
            if (error) throw error;
            
            // 상품별 집계
            const salesByProduct = data.reduce((acc, order) => {
                const productId = order.product_id;
                if (!acc[productId]) {
                    acc[productId] = {
                        product: order.products,
                        totalSales: 0,
                        orderCount: 0
                    };
                }
                acc[productId].totalSales += order.total_amount;
                acc[productId].orderCount += 1;
                return acc;
            }, {});
            
            return { success: true, data: Object.values(salesByProduct) };
        } catch (error) {
            console.error('상품별 판매 통계 조회 오류:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 사용자 통계
    async getUserStats() {
        try {
            const { data: totalUsers, error: userError } = await supabase
                .from('users')
                .select('id', { count: 'exact' });
            
            if (userError) throw userError;
            
            const { data: activeUsers, error: activeError } = await supabase
                .from('access_rights')
                .select('user_id', { count: 'exact' });
            
            if (activeError) throw activeError;
            
            return { 
                success: true, 
                data: { 
                    totalUsers: totalUsers.length,
                    activeUsers: new Set(activeUsers.map(a => a.user_id)).size
                } 
            };
        } catch (error) {
            console.error('사용자 통계 조회 오류:', error);
            return { success: false, error: error.message };
        }
    }
};

// 데이터베이스 초기화
async function initializeDatabase() {
    console.log('🔧 데이터베이스 초기화 시작...');
    
    const isConnected = await testConnection();
    if (!isConnected) {
        throw new Error('데이터베이스 연결에 실패했습니다.');
    }
    
    console.log('✅ 데이터베이스 초기화 완료');
    return true;
}

// 모듈 내보내기
module.exports = {
    supabase,
    initializeDatabase,
    testConnection,
    ProductService,
    UserService,
    OrderService,
    AccessService,
    ReviewService,
    AnalyticsService
};
