# Payapp 결제 시스템 설정 가이드

## 개요
MCSELLER 플랫폼에서 Payapp 결제 시스템을 사용하여 자동화된 결제 처리를 구현합니다.

## 시스템 아키텍처

### 1. 결제 플로우
1. 관리자가 상품별 Payapp URL을 설정
2. 사용자가 결제 버튼 클릭 시 Payapp 결제 페이지로 이동
3. 결제 완료 시 Payapp에서 Webhook 호출
4. 서버에서 주문 정보 저장 및 콘텐츠 접근 권한 부여
5. 슬랙 알림 전송 (선택사항)

### 2. 데이터베이스 구조
- `products` 테이블에 `payapp_url` 컬럼 추가
- `orders` 테이블에 `payapp_transaction_id`, `payapp_merchant_id` 컬럼 추가

## Payapp 설정

### 1. Payapp 계정 생성
1. Payapp 웹사이트에서 사업자 계정 생성
2. 사업자등록증 및 필요 서류 제출
3. 심사 승인 대기

### 2. 결제 링크 생성
각 상품별로 Payapp에서 결제 링크를 생성합니다:
1. Payapp 대시보드 → 결제 링크 생성
2. 상품명, 가격 설정
3. Webhook URL 설정: `https://yourdomain.com/api/webhook/payapp`
4. 생성된 결제 링크를 관리자 페이지에서 상품에 연결

### 3. Webhook 설정
Payapp에서 결제 완료 시 다음 정보가 전송됩니다:
```json
{
  "transaction_id": "거래 ID",
  "merchant_id": "상점 ID", 
  "amount": 결제금액,
  "product_name": "상품명",
  "buyer_email": "구매자 이메일",
  "buyer_name": "구매자 이름",
  "status": "completed",
  "custom_data": "{\"user_id\":\"...\",\"product_id\":\"...\"}"
}
```

## 관리자 페이지 사용법

### 1. 상품 관리
1. admin.html 접속
2. 상품 관리 섹션에서 Handsontable 그리드 확인
3. "Payapp URL" 컬럼에 Payapp에서 생성한 결제 링크 입력
4. 변경사항 자동 저장

### 2. 결제 URL 관리
- 각 상품별로 개별 Payapp URL 설정 가능
- URL 형식: `https://payapp.kr/pay/...`
- 저장 시 즉시 결제 버튼에 반영

## 자동화 기능

### 1. 결제 완료 처리
- Webhook 수신 시 자동으로 주문 정보 데이터베이스 저장
- 구매자에게 즉시 콘텐츠 접근 권한 부여
- 수동 처리 불필요

### 2. 슬랙 알림
결제 완료 시 슬랙으로 다음 정보 전송:
- 구매자 정보 (이름, 이메일)
- 상품명 및 결제금액
- 거래 ID 및 결제 시간

### 3. 콘텐츠 접근 제어
- 결제 완료된 사용자만 해당 콘텐츠 접근 가능
- mypage.html에서 구매한 콘텐츠 목록 확인
- 미구매 시 자동으로 결제 페이지로 이동

## 테스트 방법

### 1. 테스트 상품 생성
1. 관리자 페이지에서 테스트 상품 생성
2. Payapp 테스트 결제 링크 설정
3. 테스트 결제 진행

### 2. Webhook 테스트
```bash
curl -X POST http://localhost:5000/api/webhook/payapp \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test_123",
    "merchant_id": "merchant_test",
    "amount": 49000,
    "product_name": "테스트 상품",
    "buyer_email": "test@example.com",
    "buyer_name": "테스트 구매자",
    "status": "completed",
    "custom_data": "{\"user_id\":\"user_id_here\",\"product_id\":\"product_id_here\"}"
  }'
```

## 문제 해결

### 1. Webhook이 호출되지 않는 경우
- Payapp 설정에서 Webhook URL 확인
- 서버가 외부에서 접근 가능한지 확인
- 로그에서 오류 메시지 확인

### 2. 결제 후 접근 권한이 부여되지 않는 경우
- custom_data에 올바른 user_id, product_id가 포함되었는지 확인
- 데이터베이스 연결 상태 확인
- 서버 로그에서 오류 확인

### 3. 슬랙 알림이 오지 않는 경우
- SLACK_BOT_TOKEN, SLACK_CHANNEL_ID 환경변수 확인
- 슬랙 봇 권한 설정 확인
- 채널에 봇이 추가되었는지 확인

## 보안 고려사항

### 1. Webhook 검증
- Payapp에서 제공하는 서명 검증 구현 권장
- IP 화이트리스트 설정

### 2. 데이터 보호
- 결제 정보는 최소한으로 저장
- 개인정보는 암호화하여 저장
- 정기적인 로그 정리

## 모니터링

### 1. 결제 현황 확인
- 관리자 페이지에서 주문 내역 확인
- 슬랙 알림으로 실시간 모니터링

### 2. 오류 추적
- 서버 로그에서 Webhook 처리 오류 확인
- 결제 실패 시 원인 분석

이 설정을 완료하면 완전 자동화된 Payapp 결제 시스템이 구축됩니다.