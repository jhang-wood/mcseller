/**
 * Service Worker 완전 제거 스크립트
 * 문제 해결을 위해 모든 Service Worker와 캐시를 삭제합니다.
 */

async function clearAllServiceWorkers() {
    console.log('🧹 Service Worker 정리 시작...');
    
    try {
        // 1. 모든 Service Worker 등록 해제
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            for (let registration of registrations) {
                const success = await registration.unregister();
                console.log(`✅ Service Worker 제거: ${registration.scope} - ${success ? '성공' : '실패'}`);
            }
        }
        
        // 2. 모든 캐시 삭제
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            
            for (let cacheName of cacheNames) {
                const success = await caches.delete(cacheName);
                console.log(`🗑️ 캐시 삭제: ${cacheName} - ${success ? '성공' : '실패'}`);
            }
        }
        
        // 3. IndexedDB 정리 (선택사항)
        if ('indexedDB' in window) {
            const databases = await indexedDB.databases();
            
            for (let db of databases) {
                if (db.name && db.name.includes('workbox')) {
                    indexedDB.deleteDatabase(db.name);
                    console.log(`💾 IndexedDB 삭제: ${db.name}`);
                }
            }
        }
        
        console.log('✅ Service Worker 정리 완료!');
        console.log('🔄 페이지를 새로고침하세요.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Service Worker 정리 중 오류:', error);
        return false;
    }
}

// 자동 실행 (페이지 로드 시)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearAllServiceWorkers);
} else {
    clearAllServiceWorkers();
}

// 전역 함수로 노출 (수동 실행 가능)
window.clearServiceWorkers = clearAllServiceWorkers; 