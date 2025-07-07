-- MCSELLER 관리자 페이지용 데이터베이스 스키마
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 상품 테이블 (products)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('lecture', 'ebook')),
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    image_url TEXT,
    content_url TEXT,
    youtube_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 주문 테이블 (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 정보 테이블 (users) - auth.users 확장
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 리뷰 테이블 (reviews)
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 구매 접근 권한 테이블 (purchase_access)
CREATE TABLE IF NOT EXISTS purchase_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, product_id)
);

-- 6. 할인 코드 테이블 (discount_codes)
CREATE TABLE IF NOT EXISTS discount_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percent', 'amount')),
    value DECIMAL(10,2) NOT NULL,
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 프로모션 테이블 (promotions)
CREATE TABLE IF NOT EXISTS promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('banner', 'popup', 'email')),
    content TEXT,
    image_url TEXT,
    target_url TEXT,
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 사이트 설정 테이블 (site_settings)
CREATE TABLE IF NOT EXISTS site_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_purchase_access_user_id ON purchase_access(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_access_product_id ON purchase_access(product_id);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 관리자 정책 (특정 이메일을 가진 사용자만 접근 가능)
CREATE POLICY "관리자만 상품 관리 가능" ON products
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 주문 관리 가능" ON orders
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 사용자 관리 가능" ON users
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 리뷰 관리 가능" ON reviews
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 구매 접근 권한 관리 가능" ON purchase_access
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 할인 코드 관리 가능" ON discount_codes
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 프로모션 관리 가능" ON promotions
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

CREATE POLICY "관리자만 사이트 설정 관리 가능" ON site_settings
    FOR ALL USING (
        auth.email() IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com')
    );

-- 기본 사이트 설정 데이터 삽입
INSERT INTO site_settings (key, value, description) VALUES
    ('new_user_points', '1000', '신규 회원 가입 시 지급되는 포인트'),
    ('site_title', 'MCSELLER', '사이트 제목'),
    ('site_description', '온라인 강의 및 전자책 판매 플랫폼', '사이트 설명'),
    ('contact_email', 'admin@mcsell.co.kr', '고객 문의 이메일'),
    ('kakao_channel_url', 'http://pf.kakao.com/_pWbgxj', '카카오 채널 URL'),
    ('maintenance_mode', 'false', '유지보수 모드')
ON CONFLICT (key) DO NOTHING;

-- 샘플 데이터 삽입
INSERT INTO products (title, description, type, price, image_url, content_url, is_active) VALUES
    ('온라인 수익화 전략서 1탄', '온라인에서 수익을 창출하는 다양한 전략을 소개하는 전자책입니다.', 'ebook', 29000, '/images/ebook1.jpg', '/ebook1-landing.html', true),
    ('실전 수익화 가이드북 2탄', '실무에서 바로 적용할 수 있는 수익화 가이드북입니다.', 'ebook', 39000, '/images/ebook2.jpg', '/ebook2-landing.html', true),
    ('AI 마스터 실전 과정', 'AI 기술을 활용한 실전 과정 강의입니다.', 'lecture', 99000, '/images/ai-course.jpg', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', true),
    ('마케팅 완전정복', '디지털 마케팅의 모든 것을 담은 강의', 'lecture', 299000, 'https://via.placeholder.com/400x300', true),
    ('파이썬 프로그래밍', 'Python 기초부터 고급까지 완전 가이드', 'ebook', 49000, 'https://via.placeholder.com/400x300', true),
    ('비즈니스 전략 수립', '성공하는 비즈니스 전략 수립 방법', 'lecture', 199000, 'https://via.placeholder.com/400x300', true)
ON CONFLICT DO NOTHING;

-- 샘플 할인 코드 삽입
INSERT INTO discount_codes (code, type, value, max_uses, is_active, expires_at) VALUES
    ('WELCOME10', 'percent', 10, 100, true, NOW() + INTERVAL '30 days'),
    ('SAVE5000', 'amount', 5000, 50, true, NOW() + INTERVAL '7 days'),
    ('WELCOME20', 'percent', 20, 100, true, NOW() + INTERVAL '30 days'),
    ('SAVE10000', 'amount', 10000, 50, true, NOW() + INTERVAL '7 days')
ON CONFLICT (code) DO NOTHING;

-- 샘플 프로모션 삽입
INSERT INTO promotions (title, description, type, content, is_active, starts_at, ends_at) VALUES
    ('신규 회원 할인', '신규 회원 대상 20% 할인 이벤트', 'banner', '첫 구매 시 20% 할인 혜택을 받으세요!', true, NOW(), NOW() + INTERVAL '30 days'),
    ('여름 특가 이벤트', '여름 시즌 특가 이벤트', 'popup', '모든 상품 최대 50% 할인!', true, NOW(), NOW() + INTERVAL '15 days'),
    ('신규 회원 환영 이벤트', '신규 가입 회원 20% 할인', 'banner', '지금 가입하고 20% 할인 혜택을 받으세요!', true, NOW(), NOW() + INTERVAL '30 days'),
    ('한정 특가 세일', '인기 강의 특가 판매', 'popup', '놓치면 후회하는 특가! 지금 바로 확인하세요', true, NOW(), NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING; 