const CACHE_NAME = 'chandika-pro-v9.0.2';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './ico.png'
    // Kita tidak cache CDN (Tailwind/FontAwesome) secara eksplisit 
    // agar tidak error CORS, browser akan menanganinya otomatis.
];

// 1. INSTALL SERVICE WORKER
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

// 2. AKTIVASI & BERSIHKAN CACHE LAMA
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

// 3. FETCH STRATEGY (PENTING UNTUK TRADING APP)
self.addEventListener('fetch', (event) => {
    // A. JIKA REQUEST KE NGROK (API DATA) -> JANGAN PAKAI CACHE!
    // Kita mau data trading selalu fresh dari network
    if (event.request.url.includes('ngrok-free.app') || event.request.url.includes('ngrok-free.dev')) {
        return; // Biarkan browser handle secara normal (Network Only)
    }

    // B. JIKA REQUEST FILE APLIKASI (HTML, CSS, JS) -> PAKAI CACHE BIAR CEPAT
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cache kalau ada, kalau tidak ada ambil dari network
            return response || fetch(event.request);
        })
    );
});
