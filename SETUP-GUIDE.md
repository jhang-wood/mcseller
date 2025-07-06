# MCSELLER 프로덕션 설정 가이드

이 가이드는 MCSELLER 플랫폼을 상용 서비스로 런칭하기 위한 모든 설정 단계를 안내합니다.

## 필수 준비사항

### 1. Supabase 설정

1. **Supabase 프로젝트 생성**
   - https://supabase.com 에서 프로젝트 생성
   - 프로젝트 설정에서 URL과 Anon Key 확인

2. **데이터베이스 스키마 설정**
   - Supabase 대시보드 → SQL Editor 접속
   - `database-schema.sql` 파일의 전체 내용 복사
   - SQL Editor에 붙여넣고 실행

3. **인증 설정**
   - Authentication → Providers에서 이메일 인증 활성화
   - (선택) Google, Kakao OAuth 설정

### 2. 토스페이 설정

1. **토스페이 가입 및 사업자 등록**
   - https://www.tosspayments.com 에서 가입
   - 사업자등록증 제출 및 심사 승인 대기

2. **API 키 발급**
   - 대시보드 → 개발자 센터 → API 키 관리
   - `Client Key` (공개키) 복사
   - `Secret Key` (비밀키) 복사

3. **결제 승인 URL 설정**
   - 성공 URL: `https://yourdomain.com/payment-success.html`
   - 실패 URL: `https://yourdomain.com/payment-fail.html`

### 3. 환경 변수 설정

Replit에서 다음 환경 변수를 설정합니다:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

### 4. 도메인 설정 (선택사항)

1. 도메인 구매 (예: Namecheap, GoDaddy)
2. Replit 대시보드에서 커스텀 도메인 연결
3. SSL 인증서 자동 설정

## 상품 등록

### 1. 관리자 계정 생성
   - `ADMIN-SETUP.md` 참조하여 관리자 계정 생성

### 2. 상품 데이터 입력
   Supabase SQL Editor에서 실행:

```sql
INSERT INTO public.products (title, description, price, product_type, image_url, content_url) VALUES
('전자책 1탄: 온라인 비즈니스 시작하기', '초보자를 위한 온라인 비즈니스 가이드', 49000, 'ebook', '/images/ebook1.jpg', '/content/ebook1.pdf'),
('전자책 2탄: 고급 마케팅 전략', '성공적인 온라인 마케팅을 위한 전략서', 79000, 'ebook', '/images/ebook2.jpg', '/content/ebook2.pdf'),
('동영상 강의: AI 활용 자동화', 'AI를 활용한 비즈니스 자동화 마스터 클래스', 299000, 'course', '/images/course1.jpg', 'https://youtube.com/watch?v=xxxxx');
```

## 콘텐츠 업로드

### 1. 전자책 파일
   - Supabase Storage에 PDF 파일 업로드
   - 공개 URL 생성하여 products 테이블의 content_url에 입력

### 2. 동영상 콘텐츠
   - YouTube에 비공개/미등록 동영상 업로드
   - 동영상 URL을 products 테이블의 content_url에 입력

## 테스트 체크리스트

### 1. 회원가입/로그인
- [ ] 이메일 회원가입 작동
- [ ] 로그인 후 프로필 드롭다운 표시
- [ ] 마이페이지 접근 가능
- [ ] 로그아웃 기능 작동

### 2. 결제 테스트
- [ ] 상품 선택 및 결제 페이지 이동
- [ ] 토스페이 결제창 정상 표시
- [ ] 테스트 카드로 결제 진행
- [ ] 결제 성공 시 콘텐츠 접근 권한 부여

### 3. 콘텐츠 접근
- [ ] 구매한 콘텐츠만 접근 가능
- [ ] 미구매 콘텐츠 접근 시 구매 페이지로 이동
- [ ] 전자책 뷰어 정상 작동
- [ ] 동영상 플레이어 정상 작동

### 4. 관리자 기능
- [ ] 관리자 계정으로 admin.html 접근
- [ ] 상품 관리 기능
- [ ] 주문 내역 확인
- [ ] 사용자 관리

## 런칭 전 최종 점검

1. **보안 점검**
   - [ ] 모든 API 키가 환경 변수로 설정됨
   - [ ] 테스트 계정 코드 제거 확인
   - [ ] RLS 정책 활성화 확인

2. **성능 최적화**
   - [ ] 이미지 최적화
   - [ ] JavaScript 파일 압축
   - [ ] 캐시 설정 확인

3. **법적 준수사항**
   - [ ] 이용약관 페이지 준비
   - [ ] 개인정보처리방침 페이지 준비
   - [ ] 환불정책 명시

## 문제 해결

### Supabase 연결 오류
1. 환경 변수 확인
2. Supabase 프로젝트 상태 확인
3. 네트워크 연결 확인

### 결제 오류
1. 토스페이 API 키 확인
2. 결제 승인 URL 설정 확인
3. 토스페이 대시보드에서 오류 로그 확인

### 콘텐츠 접근 오류
1. purchased_content 테이블 데이터 확인
2. RLS 정책 확인
3. 브라우저 콘솔 로그 확인

## 지원 및 유지보수

- 정기적인 데이터베이스 백업
- 사용자 피드백 수집 및 개선
- 보안 업데이트 적용