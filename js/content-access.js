/**
 * MCSELLER 콘텐츠 접근 제어 시스템
 * 구매한 콘텐츠만 볼 수 있도록 제어
 */

// 사용자가 특정 상품을 구매했는지 확인
async function checkProductAccess(productId) {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return false;
    }
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            console.log('로그인되지 않은 사용자입니다.');
            return false;
        }
        
        // purchased_content 테이블에서 확인
        const { data, error } = await window.supabaseClient
            .from('purchased_content')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();
        
        if (error && error.code !== 'PGRST116') {
            console.error('구매 확인 오류:', error);
            return false;
        }
        
        return !!data;
    } catch (error) {
        console.error('접근 권한 확인 실패:', error);
        return false;
    }
}

// 사용자의 모든 구매 내역 가져오기
async function getUserPurchases() {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return [];
    }
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) {
            return [];
        }
        
        const { data, error } = await window.supabaseClient
            .from('purchased_content')
            .select(`
                *,
                products (
                    id,
                    title,
                    description,
                    product_type,
                    image_url,
                    content_url
                )
            `)
            .eq('user_id', user.id);
        
        if (error) {
            console.error('구매 내역 조회 오류:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('구매 내역 조회 실패:', error);
        return [];
    }
}

// 콘텐츠 접근 시도
async function attemptContentAccess(productId, contentUrl) {
    const hasAccess = await checkProductAccess(productId);
    
    if (hasAccess) {
        // 접근 허용
        return { success: true, url: contentUrl };
    } else {
        // 접근 거부
        return { 
            success: false, 
            message: '이 콘텐츠를 보려면 구매가 필요합니다.',
            redirectTo: `/product-detail.html?id=${productId}`
        };
    }
}

// 콘텐츠 뷰어 페이지에서 사용
async function validateContentAccess(productId) {
    const hasAccess = await checkProductAccess(productId);
    
    if (!hasAccess) {
        alert('이 콘텐츠에 접근할 수 없습니다. 구매가 필요합니다.');
        window.location.href = `/product-detail.html?id=${productId}`;
        return false;
    }
    
    return true;
}

// 구매 후 콘텐츠 접근 권한 부여
async function grantContentAccess(orderId) {
    if (!window.supabaseClient) {
        console.error('Supabase 클라이언트가 초기화되지 않았습니다.');
        return false;
    }
    
    try {
        // 주문 정보 조회
        const { data: order, error: orderError } = await window.supabaseClient
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        
        if (orderError || !order) {
            console.error('주문 조회 오류:', orderError);
            return false;
        }
        
        // 이미 권한이 있는지 확인
        const { data: existing } = await window.supabaseClient
            .from('purchased_content')
            .select('*')
            .eq('user_id', order.user_id)
            .eq('product_id', order.product_id)
            .single();
        
        if (existing) {
            console.log('이미 접근 권한이 있습니다.');
            return true;
        }
        
        // 접근 권한 부여
        const { error: accessError } = await window.supabaseClient
            .from('purchased_content')
            .insert({
                user_id: order.user_id,
                product_id: order.product_id,
                order_id: order.id
            });
        
        if (accessError) {
            console.error('접근 권한 부여 오류:', accessError);
            return false;
        }
        
        console.log('콘텐츠 접근 권한이 부여되었습니다.');
        return true;
    } catch (error) {
        console.error('접근 권한 부여 실패:', error);
        return false;
    }
}

// 관리자 권한 확인
async function checkAdminAccess() {
    if (!window.supabaseClient) {
        return false;
    }
    
    try {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (!user) return false;
        
        // 사용자 프로필에서 role 확인
        const { data: profile } = await window.supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
        
        return profile?.role === 'admin';
    } catch (error) {
        console.error('관리자 권한 확인 실패:', error);
        return false;
    }
}

// Export functions
window.contentAccess = {
    checkProductAccess,
    getUserPurchases,
    attemptContentAccess,
    validateContentAccess,
    grantContentAccess,
    checkAdminAccess
};