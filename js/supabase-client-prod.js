/**
 * MCSELLER Supabase 클라이언트 - 프로덕션
 * supabase-client.js로 리다이렉트
 * 
 * 이 파일은 하위 호환성을 위해 유지됩니다.
 * 실제 구현은 supabase-client.js에 있습니다.
 */

console.log('📋 supabase-client-prod.js -> supabase-client.js로 통합됨');

// supabase-client.js가 이미 로드되었는지 확인
if (typeof initializeSupabaseClient === 'undefined') {
    console.warn('⚠️ supabase-client.js가 먼저 로드되어야 합니다.');
}