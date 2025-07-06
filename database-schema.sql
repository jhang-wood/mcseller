-- MCSELLER 프로덕션 데이터베이스 스키마
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 1. 사용자 테이블 (인증은 Supabase Auth 사용)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    points INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 상품 테이블
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    discounted_price INTEGER,
    product_type TEXT NOT NULL CHECK (product_type IN ('ebook', 'course', 'bundle')),
    image_url TEXT,
    content_url TEXT,
    payapp_url TEXT, -- Payapp 결제 링크 URL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 주문 테이블
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_key TEXT,
    order_id TEXT UNIQUE,
    payapp_transaction_id TEXT, -- Payapp 거래 ID
    payapp_merchant_id TEXT, -- Payapp 상점 ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. 구매한 콘텐츠 테이블 (빠른 접근 제어를 위한 별도 테이블)
CREATE TABLE IF NOT EXISTS public.purchased_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    order_id UUID REFERENCES public.orders(id),
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, product_id)
);

-- 5. 리뷰 테이블
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. 쿠폰 테이블
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value INTEGER NOT NULL,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. 사용자 쿠폰 사용 내역
CREATE TABLE IF NOT EXISTS public.user_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    coupon_id UUID REFERENCES public.coupons(id) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, coupon_id)
);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchased_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

-- RLS 정책

-- profiles 테이블
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage all profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- products 테이블
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage products" ON products FOR ALL USING (auth.role() = 'service_role');

-- orders 테이블
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all orders" ON orders FOR ALL USING (auth.role() = 'service_role');

-- purchased_content 테이블
CREATE POLICY "Users can view own purchases" ON purchased_content FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage purchases" ON purchased_content FOR ALL USING (auth.role() = 'service_role');

-- reviews 테이블
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- coupons 테이블
CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage coupons" ON coupons FOR ALL USING (auth.role() = 'service_role');

-- user_coupons 테이블
CREATE POLICY "Users can view own coupon usage" ON user_coupons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can use coupons" ON user_coupons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage coupon usage" ON user_coupons FOR ALL USING (auth.role() = 'service_role');

-- 트리거: profiles 테이블 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, created_at, updated_at)
    VALUES (new.id, new.email, now(), now())
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_products_type ON products(product_type);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(payment_status);
CREATE INDEX idx_purchased_content_user_product ON purchased_content(user_id, product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- 샘플 데이터 (필요시 주석 해제)
/*
INSERT INTO public.products (title, description, price, product_type, image_url, content_url) VALUES
('전자책 1탄: 온라인 비즈니스 시작하기', '초보자를 위한 온라인 비즈니스 가이드', 49000, 'ebook', '/images/ebook1.jpg', '/content/ebook1.pdf'),
('전자책 2탄: 고급 마케팅 전략', '성공적인 온라인 마케팅을 위한 전략서', 79000, 'ebook', '/images/ebook2.jpg', '/content/ebook2.pdf'),
('동영상 강의: AI 활용 자동화', 'AI를 활용한 비즈니스 자동화 마스터 클래스', 299000, 'course', '/images/course1.jpg', 'https://youtube.com/watch?v=xxxxx');
*/