# Supabase Anon Key 업데이트 가이드

## 🚨 현재 문제
"Invalid API key" 오류가 발생하고 있습니다. 이는 Supabase Anon Key가 잘못되었거나 만료되었기 때문입니다.

## 🔧 해결 방법

### 1. Supabase 대시보드 접속
1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. MCSELLER 프로젝트 선택

### 2. Anon Key 확인
1. 왼쪽 메뉴에서 **Settings** 클릭
2. **API** 섹션 클릭
3. **Project API keys** 섹션에서 **anon public** 키 복사

### 3. 코드 업데이트
`js/supabase-config.js` 파일을 열고 다음 부분을 수정:

```javascript
window.SUPABASE_CONFIG = {
    // Supabase 프로젝트 URL
    url: "https://rpcctgtmtplfahwtnglq.supabase.co",
    
    // 여기에 복사한 Anon Key를 붙여넣으세요 👇
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwY2N0Z3RtdHBsZmFod3RuZ2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwNjUzMTEsImV4cCI6MjA2NjY0MTMxMX0.yv63jWBQIjbzRWh2w6fAu1vgs3W_wQvEL4ePnTD5Sss",
    
    // ... 나머지 설정
};
```

### 4. 브라우저 캐시 삭제
1. `Ctrl + Shift + Delete` 키 누르기
2. "캐시된 이미지 및 파일" 선택
3. "지우기" 클릭

### 5. 페이지 새로고침
`Ctrl + F5`로 하드 리프레시

## ✅ 확인 방법
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 다음 메시지 확인:
   - "✅ Supabase 클라이언트 초기화 완료"
   - "✅ Supabase 설정 검증 완료"

## 🔍 추가 확인 사항
- Supabase 프로젝트가 활성 상태인지 확인
- 프로젝트가 일시 중지되지 않았는지 확인
- Anon Key가 정확히 복사되었는지 확인 (공백 없이)

## 📞 도움이 필요하면
1. Supabase 대시보드 스크린샷 촬영
2. Console 오류 메시지 복사
3. 관리자에게 문의 