const CACHE_NAME = 'chandika-pro-v9.0.2';
const DYNAMIC_CACHE = 'chandika-dynamic-v1';

// Daftar file statis yang WAJIB di-cache agar aplikasi bisa buka tanpa internet
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './ico.png', // Pastikan Anda punya file ini
    // CDN External (Opsional: lebih baik download file ini jika ingin 100% offline)
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 1. Install Service Worker & Cache Aset Statis
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate & Bersihkan Cache Lama (Jika ganti versi)
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. Fetch Strategy: Network First (Prioritas Internet, kalau mati baru ambil Cache)
// Ini penting untuk Trading Dashboard agar harga tidak "nyangkut" di harga lama
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Jangan cache request ke API Ngrok (biar data selalu real-time)
    if (url.href.includes('ngrok-free.app')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Jika berhasil ambil dari internet, simpan copy-nya ke cache dinamis
                return caches.open(DYNAMIC_CACHE).then((cache) => {
                    // Cache hanya file GET, bukan POST/PUT
                    if(event.request.method === 'GET') {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            })
            .catch(() => {
                // Jika internet mati, ambil dari cache
                return caches.match(event.request);
            })
    );
});
