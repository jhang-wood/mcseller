// 플랫폼 설정 및 Supabase 구성
// DATABASE_URL에서 Supabase 정보 자동 추출

// Supabase 설정 추출 함수
function extractSupabaseConfig() {
    // 실제 환경에서는 서버에서 제공하는 설정을 사용
    // 개발 환경에서는 기본 설정 사용
    
    // 실제 Supabase 프로젝트 정보 (DATABASE_URL에서 추출)
    // 예: postgresql://postgres:password@abc123.supabase.co:6543/postgres
    // 에서 abc123.supabase.co를 추출하여 https://abc123.supabase.co로 변환
    
    return {
        supabaseUrl: 'https://dummy-project.supabase.co', // 실제로는 DATABASE_URL에서 추출
        supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByb2plY3QtcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDU0MjQ4MjAsImV4cCI6MTk2MTAwMDgyMH0'
    };
}

// 플랫폼 기본 설정
const CONFIG = {
    // 결제 설정
    PAYMENT: {
        TOSS_CLIENT_KEY: 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq', // 테스트 키
        CURRENCY: 'KRW',
        COUNTRY: 'KR'
    },
    
    // API 엔드포인트
    API: {
        BASE_URL: window.location.origin,
        ENDPOINTS: {
            PRODUCTS: '/api/products',
            ORDERS: '/api/orders',
            USERS: '/api/users',
            REVIEWS: '/api/reviews'
        }
    },
    
    // 플랫폼 정보
    PLATFORM: {
        NAME: '교육플랫폼',
        DESCRIPTION: '최고의 온라인 교육 콘텐츠를 제공하는 한국의 대표 교육 플랫폼',
        SUPPORT_EMAIL: 'support@education.co.kr',
        SUPPORT_PHONE: '1588-1234'
    },
    
    // 기능 플래그
    FEATURES: {
        KAKAO_CHAT: true,
        SOCIAL_LOGIN: true,
        PAYMENT_ENABLED: true,
        REVIEWS_ENABLED: true
    }
};

// Supabase 설정
const SUPABASE_CONFIG = extractSupabaseConfig();

// 전역으로 설정 내보내기
window.APP_CONFIG = CONFIG;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

console.log('📱 플랫폼 설정이 로드되었습니다.');