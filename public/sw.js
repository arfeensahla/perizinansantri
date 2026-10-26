self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Menangkap sinyal Push dari Edge Function walaupun aplikasi ditutup total
self.addEventListener('push', (event) => {
    let data = {
        title: '🔔 Ajuan E-Pass Baru!',
        body: 'Ada pengajuan izin santri baru yang menunggu persetujuan.',
        badge: 1,
        url: '/'
    };

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200, 100, 300],
        tag: 'epass-notif-' + Date.now(), // Agar setiap ajuan baru selalu berbunyi & muncul di atas layar
        renotify: true,
        requireInteraction: true,
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        Promise.all([
            self.registration.showNotification(data.title, options),
            // Pasang angka (badge counter) di ikon aplikasi PWA
            (async () => {
                if ('setAppBadge' in self.navigator) {
                    try {
                        await self.navigator.setAppBadge(data.badge || 1);
                    } catch (err) {
                        console.error('Gagal setAppBadge di SW:', err);
                    }
                }
            })()
        ])
    );
});

// Saat notifikasi diklik, buka aplikasi & arahkan ke tab Persetujuan Izin
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (const client of windowClients) {
                if ('focus' in client) {
                    client.postMessage({ type: 'BUKA_PERSETUJUAN' });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data?.url || '/');
            }
        })
    );
});