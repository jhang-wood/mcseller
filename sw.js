// MCSELLER PWA Service Worker
const CACHE_VERSION = 'v1.1.0';
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
  
  // 모든 HTML 페이지는 Service Worker 처리 제외 (안정성 최우선)
  const excludedPaths = [
    '/admin.html', 
    '/auth.html', 
    '/index.html', 
    '/mypage.html',
    '/payment.html',
    '/product-detail.html',
    '/ebook-viewer.html',
    '/video-viewer.html',
    '/payment-success.html',
    '/payment-fail.html',
    '/'
  ];
  
  // HTML 파일이거나 제외 경로인 경우 네트워크 직접 처리
  if (excludedPaths.includes(url.pathname) || url.pathname.endsWith('.html')) {
    console.log('🚫 Service Worker 처리 제외:', url.pathname);
    return;
  }

  // CDN 리소스는 단순 네트워크 요청
  const isCdn = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'unpkg.com',
    'via.placeholder.com'
  ].some(domain => url.hostname.includes(domain));

  if (isCdn) {
    console.log('🌐 CDN 리소스 직접 로드:', url.hostname);
    return;
  }
  
  // Supabase API는 네트워크 직접 처리
  if (url.hostname.includes('supabase.co')) {
    console.log('🔑 Supabase API 직접 처리:', url.pathname);
    return;
  }

  // 나머지 정적 리소스만 캐시 처리 (CSS, JS, 이미지 등)
  if (request.method === 'GET' && !url.pathname.startsWith('/api')) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        // 캐시가 있으면 캐시 반환, 없으면 네트워크
        if (cachedResponse) {
          console.log('📦 캐시에서 로드:', url.pathname);
          return cachedResponse;
        }
        
        // 네트워크에서 가져오기
        return fetch(request).then(networkResponse => {
          // 성공적인 응답만 캐시에 저장
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseToCache).catch(err => {
                console.warn('캐시 저장 실패:', err);
              });
            });
          }
          return networkResponse;
        }).catch(error => {
          console.error('네트워크 요청 실패:', url.pathname, error);
          // 오프라인 폴백
          return new Response('오프라인 상태입니다', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      })
    );
  }
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