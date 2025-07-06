/**
 * 랜딩 페이지용 결제 처리 스크립트
 * 1. .pay-button 클래스를 가진 버튼에 클릭 이벤트 리스너를 추가합니다.
 * 2. 사용자가 로그인했는지 확인합니다. (로그인 안했으면 /auth.html 로 이동)
 * 3. data-product-title 속성을 읽어 Supabase에서 상품 정보를 조회합니다.
 * 4. 상품의 payapp_url을 가져와 Payapp 결제 페이지로 리디렉션합니다.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Supabase 클라이언트가 초기화될 때까지 기다립니다.
    document.addEventListener('supabase-ready', () => {
        const payButtons = document.querySelectorAll('.pay-button');
        
        if (payButtons.length === 0) {
            console.warn('결제 버튼(.pay-button)을 찾을 수 없습니다.');
            return;
        }
        
        payButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                
                const productTitle = button.dataset.productTitle;
                if (!productTitle) {
                    console.error('버튼에 data-product-title 속성이 없습니다.');
                    alert('상품 정보가 설정되지 않았습니다. 관리자에게 문의해주세요.');
                    return;
                }

                try {
                    // 1. 사용자 로그인 상태 확인
                    const user = await window.getCurrentUser();
                    if (!user) {
                        alert('결제를 진행하려면 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
                        sessionStorage.setItem('redirectUrl', window.location.href);
                        window.location.href = '/auth.html';
                        return;
                    }
                    
                    // 2. 상품 정보 조회 (payapp_url 포함)
                    console.log(`'${productTitle}' 상품 정보를 조회합니다...`);
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('id, title, payapp_url')
                        .ilike('title', `%${productTitle}%`) // 부분 일치 검색
                        .single();

                    if (productError || !product) {
                        console.error('상품 정보 조회 오류:', productError);
                        alert(`'${productTitle}' 상품을 찾을 수 없습니다. 관리자에게 문의해주세요.`);
                        return;
                    }

                    if (!product.payapp_url) {
                        alert('결제 링크가 설정되지 않은 상품입니다. 관리자에게 문의해주세요.');
                        return;
                    }

                    // 3. Payapp 결제 페이지로 이동
                    console.log('Payapp 결제를 시작합니다:', product.payapp_url);

                    const payappUrl = new URL(product.payapp_url);
                    
                    // 사용자 정보를 custom_data로 추가 (Webhook에서 사용)
                    const customData = {
                        userId: user.id,
                        productId: product.id,
                    };
                    payappUrl.searchParams.set('custom_data', JSON.stringify(customData));
                    
                    // Payapp에 전달할 추가 정보
                    payappUrl.searchParams.set('buyer_email', user.email);

                    // 이름 정보가 profile에 있을 경우 추가
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();

                    if (profile && profile.full_name) {
                        payappUrl.searchParams.set('buyer_name', profile.full_name);
                    }

                    window.location.href = payappUrl.toString();

                } catch (error) {
                    console.error('결제 처리 중 예외 발생:', error);
                    alert('결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                }
            });
        });
    });
}); 