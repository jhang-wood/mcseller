-- MCSELLER 플랫폼 Supabase 데이터베이스 설정
-- SQL Editor에서 실행하세요

-- 1. profiles 테이블 업데이트 (이미 존재한다면 스킵)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS id UUID REFERENCES auth.users ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- UUID를 Primary Key로 설정 (이미 설정되어 있다면 스킵)
-- ALTER TABLE profiles ADD PRIMARY KEY (uuid);

-- 2. 사용자 등록 시 자동으로 profiles 테이블에 추가하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (uuid, email, full_name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 생성 (사용자 등록 시 자동 실행)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Row Level Security (RLS) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 5. profiles 테이블 정책
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = uuid);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = uuid);

-- 6. purchases 테이블 정책
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. products 테이블 정책 (모든 사용자가 읽기 가능)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

-- 8. 관리자만 products 수정 가능 정책
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.uuid = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 9. 테스트 사용자 추가 (선택사항)
-- 실제 회원가입을 통해 계정을 만드는 것을 권장합니다
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'test@test.com',
--   crypt('123456', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );

-- 10. 샘플 상품 데이터 추가 (선택사항)
INSERT INTO products (id, name, description, price, type, created_at) 
VALUES 
  (gen_random_uuid(), 'AI 마스터 과정', '인공지능 자동화 완전 정복', 197000, 'course', NOW()),
  (gen_random_uuid(), '쇼핑몰 1탄 가이드', '성공하는 쇼핑몰 운영법', 49000, 'ebook', NOW()),
  (gen_random_uuid(), '마케팅 2탄 전략', '매출 10배 늘리는 마케팅', 79000, 'ebook', NOW())
ON CONFLICT DO NOTHING;

-- 설정 완료 확인
SELECT 'Database setup completed successfully!' as status;