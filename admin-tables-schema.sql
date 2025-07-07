-- MCSELLER 관리자 기능 테이블들

-- 1. 할인쿠폰 테이블
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'amount')),
    discount_value INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 콘텐츠 테이블 (전자책/강의)
CREATE TABLE IF NOT EXISTS public.contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('ebook', 'lecture')),
    price INTEGER NOT NULL,
    image_url TEXT,
    content_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 활성화
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- 4. 관리자만 접근 가능하도록 정책 설정

-- 쿠폰 테이블 정책
CREATE POLICY "Admin only access coupons" ON public.coupons
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email IN (
            'admin@mcseller.co.kr',
            'qwg18@naver.com',
            'mcseller@gmail.com',
            'rvd3855@gmail.com'
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 콘텐츠 테이블 정책
CREATE POLICY "Admin only manage contents" ON public.contents
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email IN (
            'admin@mcseller.co.kr',
            'qwg18@naver.com',
            'mcseller@gmail.com',
            'rvd3855@gmail.com'
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 일반 사용자는 활성 콘텐츠만 조회 가능
CREATE POLICY "Users can view active contents" ON public.contents
FOR SELECT USING (is_active = true);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_contents_type ON public.contents(type);
CREATE INDEX IF NOT EXISTS idx_contents_active ON public.contents(is_active);

-- 6. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 쿠폰 테이블 트리거
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 콘텐츠 테이블 트리거
DROP TRIGGER IF EXISTS update_contents_updated_at ON public.contents;
CREATE TRIGGER update_contents_updated_at
    BEFORE UPDATE ON public.contents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 