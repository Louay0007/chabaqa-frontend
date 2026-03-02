self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = {};
  }

  const title = payload.title || 'Chabaqa';
  const options = {
    body: payload.body || 'You have a new notification.',
    icon: '/Logos/ICO/brandmark.ico',
    badge: '/Logos/ICO/brandmark.ico',
    tag: payload.tag || 'chabaqa-notification',
    data: payload.data || {},
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetPath =
    (event.notification && event.notification.data && event.notification.data.url) ||
    '/creator/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          if (client.url && targetPath) {
            client.navigate(targetPath);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
      return null;
    }),
  );
});

