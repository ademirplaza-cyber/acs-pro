self.addEventListener('push', function (event) {
  let data = { title: 'ACS Top', body: 'Nova notificação', url: '/' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'acs-top-notification',
    renotify: true,
    requireInteraction: data.priority === 'URGENT' || data.priority === 'HIGH',
    data: {
      url: data.url || '/',
      notificationId: data.notificationId || null,
    },
    actions: [
      { action: 'open', title: 'Ver detalhes' },
      { action: 'close', title: 'Fechar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'ACS Top', options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
