const CACHE_NAME = 'hatsukaichi-faq-v3.1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  './icons/hatsukaichi-icon-192.png',
  './icons/hatsukaichi-icon-512.png'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
  // 即座にアクティブ化
  self.skipWaiting();
});

// フェッチ時の処理（ネットワークファーストストラテジー）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 有効なレスポンスの場合のみキャッシュに保存
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || new Response('オフラインです', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // 即座にクライアントを制御
      return self.clients.claim();
    })
  );
});
