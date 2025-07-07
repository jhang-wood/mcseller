// MCSELLER PWA Service Worker
const CACHE_VERSION = 'v1.0.7';
const CACHE_NAME = `mcseller-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;

// 캐시할 핵심 파일들
const CORE_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/modern-style.css',
  '/js/main.js',
  '/js/modern-main.js',
  '/js/supabase-client.js',
  '/manifest.json'
];

// Service Worker 설치 이벤트
self.addEventListener('install', event => {
  console.log('Service Worker: 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: 핵심 파일 캐싱 중...');
        return cache.addAll(CORE_FILES);
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
  const request = event.request;
  const url = new URL(request.url);
  
  // 관리자 페이지와 인증 페이지는 Service Worker 처리 제외
  if (url.pathname === '/admin.html' || url.pathname === '/auth.html') {
    console.log('🚫 Service Worker 처리 제외:', url.pathname);
    return;
  }

  // CDN 리소스 요청 처리
  const isCdn = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].some(domain => url.hostname.endsWith(domain));

  if (isCdn) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(request).then(cachedResponse => {
          const networkFetch = fetch(request, { credentials: 'omit', mode: 'cors' }).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }
  
  // Supabase, API, non-GET 요청은 네트워크 우선
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api') || request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  // 로컬 정적 자원은 캐시 우선
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200 && fetchResponse.type === 'basic') {
          const responseToCache = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
        return new Response('', {status: 503, statusText: 'Offline'});
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