-- MCSELLER Profiles 테이블 스키마
-- 사용자 프로필 정보와 역할(role) 관리

-- 1. profiles 테이블 생성
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS(Row Level Security) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 정책 생성
-- 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 사용자는 자신의 프로필만 수정할 수 있음
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 관리자는 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
    OR
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email IN (
            'admin@mcseller.co.kr',
            'qwg18@naver.com', 
            'mcseller@gmail.com',
            'rvd3855@gmail.com'
        )
    )
);

-- 관리자는 모든 프로필을 수정할 수 있음
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
    OR
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email IN (
            'admin@mcseller.co.kr',
            'qwg18@naver.com',
            'mcseller@gmail.com', 
            'rvd3855@gmail.com'
        )
    )
);

-- 4. 자동 프로필 생성 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        CASE 
            WHEN NEW.email IN (
                'admin@mcseller.co.kr',
                'qwg18@naver.com',
                'mcseller@gmail.com',
                'rvd3855@gmail.com'
            ) THEN 'admin'
            ELSE 'user'
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 기존 관리자 계정 프로필 생성 (수동)
-- rvd3855@gmail.com 사용자의 프로필 레코드 생성
INSERT INTO public.profiles (id, email, full_name, role, points)
VALUES (
    '5ad73968-5de2-4ef7-b934-94531fb1f456', -- 실제 사용자 UUID
    'rvd3855@gmail.com',
    '관리자',
    'admin',
    0
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    email = EXCLUDED.email,
    updated_at = NOW();

-- 7. 다른 관리자 이메일들도 등록되면 자동으로 admin role 부여
-- (트리거가 처리하므로 별도 작업 불요)

-- 8. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 9. updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. updated_at 트리거
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 