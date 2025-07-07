// MCSELLER PWA Service Worker
const CACHE_VERSION = 'v1.0.9';
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
  
  // 중요한 페이지들은 Service Worker 처리 제외하여 안정성 확보
  const excludedPaths = ['/admin.html', '/auth.html', '/index.html', '/'];
  if (excludedPaths.includes(url.pathname)) {
    console.log('🚫 Service Worker 처리 제외:', url.pathname);
    return;
  }

  // CDN 리소스 요청 처리 (리다이렉트 지원)
  const isCdn = [
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
  ].some(domain => url.hostname.endsWith(domain));

  if (isCdn) {
    event.respondWith(
      fetch(request, { 
        credentials: 'omit', 
        mode: 'cors',
        redirect: 'follow'
      }).then(response => {
        // CDN 리소스는 단순하게 반환만 하고 캐싱은 브라우저에 맡김
        return response;
      }).catch(error => {
        console.warn('CDN 리소스 로드 실패:', request.url, error);
        return new Response('', {status: 503, statusText: 'Network Error'});
      })
    );
    return;
  }
  
  // Supabase, API, non-GET 요청은 네트워크 직접 처리
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api') || request.method !== 'GET') {
    event.respondWith(
      fetch(request, {
        redirect: 'follow',
        credentials: 'same-origin'
      }).catch(error => {
        console.warn('네트워크 요청 실패:', request.url, error);
        return new Response('', {status: 503, statusText: 'Network Error'});
      })
    );
    return;
  }

  // 기타 정적 자원들만 캐시 처리
  event.respondWith(
    fetch(request, {
      redirect: 'follow',
      credentials: 'same-origin'
    }).then(fetchResponse => {
      // 성공적인 응답만 반환 (캐싱은 하지 않음)
      return fetchResponse;
    }).catch(error => {
      console.warn('리소스 로드 실패:', request.url, error);
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