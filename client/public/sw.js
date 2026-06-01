// Lovedale Service Worker — Push Notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Lovedale 💕', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/vite.svg',
    badge: '/vite.svg',
    tag: data.tag || 'lovedale-notif',
    data: data.data || { url: '/' },
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Lovedale 💕', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
