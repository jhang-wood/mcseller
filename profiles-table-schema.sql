-- MCSELLER 프로필 테이블 생성
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 프로필 테이블 생성 (auth.users와 연동)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    username VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 프로필만 볼 수 있음
CREATE POLICY "사용자는 자신의 프로필만 조회 가능" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 정책 2: 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "사용자는 자신의 프로필만 수정 가능" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 정책 3: 관리자는 모든 프로필 조회 가능
CREATE POLICY "관리자는 모든 프로필 조회 가능" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW 
    EXECUTE FUNCTION update_profiles_updated_at();

-- auth.users에 새 사용자가 생성될 때 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'username'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- 관리자 계정 설정 (이미 가입된 사용자들)
-- 먼저 프로필이 없는 사용자들의 프로필을 생성
INSERT INTO public.profiles (id, email, role)
SELECT 
    id, 
    email,
    CASE 
        WHEN email IN ('admin@mcseller.co.kr', 'qwg18@naver.com', 'mcseller@gmail.com', 'rvd3855@gmail.com') 
        THEN 'admin' 
        ELSE 'user' 
    END as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 기존 사용자들의 관리자 권한 업데이트
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN (
    'admin@mcseller.co.kr', 
    'qwg18@naver.com', 
    'mcseller@gmail.com',
    'rvd3855@gmail.com'
);

-- 신규 가입자 기본 포인트 지급 (1000포인트)
UPDATE public.profiles 
SET points = 1000 
WHERE points = 0;

-- 프로필 테이블 구조 확인
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position; 