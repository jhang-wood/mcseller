# 관리자 계정 설정 가이드

## 1. Supabase 관리자 계정 설정

### 방법 1: Supabase 대시보드에서 설정 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 로 이동
   - 본인의 프로젝트 선택

2. **SQL 에디터에서 관리자 계정 생성**
   ```sql
   -- 1. 관리자 이메일로 계정 생성 (Authentication에서 먼저 가입 필요)
   -- auth.html 페이지에서 회원가입을 먼저 진행하세요

   -- 2. 생성된 사용자를 관리자로 설정
   UPDATE auth.users 
   SET raw_user_meta_data = jsonb_set(
       COALESCE(raw_user_meta_data, '{}'::jsonb), 
       '{role}', 
       '"admin"'
   )
   WHERE email = 'admin@mcseller.com';

   -- 3. profiles 테이블이 있다면 업데이트
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'admin@mcseller.com';
   ```

### 방법 2: 테스트용 관리자 계정 (개발 환경)

현재 설정된 테스트 관리자 계정:
- **이메일**: `admin@test.com`
- **비밀번호**: `admin123`

이 계정은 개발/테스트 목적으로만 사용하세요.

## 2. 관리자 계정 생성 단계

### 단계 1: 일반 사용자로 회원가입
1. `/auth.html` 페이지에서 회원가입
2. 원하는 관리자 이메일과 비밀번호로 계정 생성
3. 이메일 인증 완료 (Supabase 설정에 따라)

### 단계 2: 관리자 권한 부여
Supabase SQL 에디터에서 실행:
```sql
-- 사용자 ID 확인
SELECT id, email FROM auth.users WHERE email = '관리자이메일@example.com';

-- 관리자 권한 부여
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
)
WHERE email = '관리자이메일@example.com';
```

### 단계 3: 관리자 페이지 접속 확인
1. 관리자 계정으로 로그인
2. `/admin.html` 페이지 접속
3. 관리자 기능이 정상 작동하는지 확인

## 3. 관리자 기능

관리자 계정으로 로그인하면 다음 기능을 사용할 수 있습니다:

### 대시보드 기능
- 수익 및 주문 통계
- 사용자 현황
- 실시간 분석 차트

### 콘텐츠 관리
- 강의/전자책 추가/수정
- 가격 설정
- 컨텐츠 활성화/비활성화

### 사용자 관리
- 사용자 목록 조회
- 구매 이력 관리
- 사용자 권한 수정

### 주문 관리
- 주문 내역 조회
- 환불 처리
- 결제 상태 관리

### 리뷰 관리
- 리뷰 승인/거절
- 리뷰 수정/삭제

## 4. 보안 주의사항

⚠️ **중요한 보안 지침**

1. **강력한 비밀번호 사용**
   - 최소 12자 이상
   - 대소문자, 숫자, 특수문자 조합

2. **관리자 계정 보호**
   - 정기적인 비밀번호 변경
   - 2단계 인증 활성화 (Supabase에서 지원시)

3. **접속 로그 모니터링**
   - Supabase 대시보드에서 인증 로그 확인
   - 비정상적인 접속 시도 감지

4. **테스트 계정 제거**
   - 프로덕션 환경에서는 테스트 계정 삭제
   - 개발용 계정과 실제 관리자 계정 분리

## 5. 문제 해결

### 관리자 페이지에 접속할 수 없는 경우

1. **권한 확인**
   ```sql
   SELECT email, raw_user_meta_data FROM auth.users 
   WHERE email = '관리자이메일@example.com';
   ```

2. **브라우저 캐시 삭제**
   - Ctrl+Shift+Delete로 캐시 삭제
   - 시크릿 모드에서 접속 시도

3. **로그인 상태 재확인**
   - 로그아웃 후 다시 로그인
   - 세션 만료 여부 확인

### 관리자 기능이 작동하지 않는 경우

1. **콘솔 로그 확인**
   - F12 → Console 탭에서 오류 메시지 확인

2. **네트워크 상태 확인**
   - F12 → Network 탭에서 API 요청 상태 확인

3. **Supabase 연결 상태 확인**
   - Supabase 프로젝트 상태 확인
   - API 키 유효성 검증

## 연락처

기술적 문제가 발생하면 개발팀에 문의하세요.

## 추가 정보

### 데이터베이스 스키마 수정

1. **profiles 테이블의 username 컬럼에 UNIQUE 제약 조건 추가**
   ```sql
   -- 중요: 실행 전, 기존 데이터에 중복된 username이 없는지 먼저 확인하세요.
   ALTER TABLE public.profiles
   ADD CONSTRAINT profiles_username_key UNIQUE (username);

   -- 2. username이 NULL인 경우를 허용하지 않도록 설정 (필요 시)
   -- 모든 사용자가 아이디를 갖게 하려면 이 쿼리를 실행하세요.
   -- ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

   -- 3. username 검색 성능 향상을 위한 인덱스 추가
   CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
   ```

### 데이터베이스 함수 생성

1. **아이디로 이메일을 안전하게 조회하는 데이터베이스 함수 생성**
   ```sql
   -- 1. 아이디로 이메일을 안전하게 조회하는 데이터베이스 함수 생성
   -- 이 함수는 RLS를 우회하여 username을 조회할 수 있도록 SECURITY DEFINER로 실행됩니다.
   CREATE OR REPLACE FUNCTION public.get_email_for_username(p_username TEXT)
   RETURNS TEXT AS $$
   DECLARE
     user_email TEXT;
   BEGIN
     SELECT email
     INTO user_email
     FROM public.profiles
     WHERE username = p_username;
     
     RETURN user_email;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- 2. 익명(anon) 사용자에게 위 함수를 실행할 권한 부여
   -- 이 권한이 있어야 로그인하지 않은 상태에서 함수를 호출할 수 있습니다.
   GRANT EXECUTE ON FUNCTION public.get_email_for_username(TEXT) TO anon;
   ```

### 회원가입 시 프로필 정보를 안전하게 업데이트하는 함수
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id UUID,
  p_username TEXT,
  p_full_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- profiles 테이블에 사용자 정보 업데이트
  UPDATE public.profiles 
  SET username = p_username, full_name = p_full_name
  WHERE id = p_user_id;
  
  -- 업데이트가 성공했는지 확인
  IF FOUND THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- authenticated 사용자(로그인한 사용자)에게 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- 아이디 중복 확인용 함수 (익명 사용자도 사용 가능)
CREATE OR REPLACE FUNCTION public.check_username_exists(p_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  username_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO username_count
  FROM public.profiles
  WHERE username = p_username;
  
  RETURN username_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 익명 사용자에게도 아이디 중복 확인 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO anon;