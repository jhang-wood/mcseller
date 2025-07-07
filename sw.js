// MCSELLER PWA Service Worker
const CACHE_NAME = 'mcseller-v1.0.1';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;

// 캐시할 핵심 파일들
const STATIC_FILES = [
  '/',
  '/index.html',
  '/auth.html',
  '/mypage.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/supabase-client.js',
  '/js/modern-main.js',
  '/manifest.json',
  // Bootstrap & Font Awesome (CDN)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap'
];

// Service Worker 설치 이벤트
self.addEventListener('install', event => {
  console.log('Service Worker: 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: 핵심 파일 캐싱 중...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: 설치 완료');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: 설치 실패', error);
      })
  );
});

// Service Worker 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('Service Worker: 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: 이전 캐시 삭제', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: 활성화 완료');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 - 네트워크 요청 인터셉트
self.addEventListener('fetch', event => {
  // 교육 콘텐츠와 인증 관련 요청은 항상 네트워크 우선
  if (event.request.url.includes('supabase.co') || 
      event.request.url.includes('youtube.com') ||
      event.request.url.includes('api') ||
      event.request.method !== 'GET') {
    
    event.respondWith(
      fetch(event.request, {
        redirect: 'follow'  // redirect 모드 명시적 설정
      })
        .catch(() => {
          // 네트워크 실패 시 오프라인 페이지 제공
          if (event.request.destination === 'document') {
            return caches.match('/offline.html');
          }
        })
    );
    return;
  }

  // 정적 파일들은 캐시 우선 전략
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request, {
          redirect: 'follow'  // redirect 모드 명시적 설정
        })
          .then(fetchResponse => {
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }
            
            // 동적 캐싱
            const responseToCache = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return fetchResponse;
          });
      })
      .catch(() => {
        // 완전 오프라인 상태
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
        
        // 이미지 요청 실패 시 기본 이미지
        if (event.request.destination === 'image') {
          return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#f0f0f0"/><text x="100" y="75" text-anchor="middle" font-family="Arial" font-size="14" fill="#999">오프라인</text></svg>', {
            headers: { 'Content-Type': 'image/svg+xml' }
          });
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: 백그라운드 동기화 실행');
    event.waitUntil(doBackgroundSync());
  }
});

// 푸시 알림
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '새로운 강의가 업데이트되었습니다!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('MCSELLER', options)
  );
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/mypage.html')
    );
  }
});

// 백그라운드 동기화 함수
async function doBackgroundSync() {
  try {
    // 오프라인 중 저장된 데이터 동기화
    const offlineData = await getOfflineData();
    if (offlineData.length > 0) {
      await syncOfflineData(offlineData);
      await clearOfflineData();
    }
  } catch (error) {
    console.error('백그라운드 동기화 실패:', error);
  }
}

async function getOfflineData() {
  // IndexedDB에서 오프라인 데이터 조회
  return [];
}

async function syncOfflineData(data) {
  // 서버로 오프라인 데이터 전송
  console.log('오프라인 데이터 동기화:', data);
}

async function clearOfflineData() {
  // 동기화 완료된 오프라인 데이터 삭제
  console.log('오프라인 데이터 정리 완료');
}