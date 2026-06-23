const CACHE_NAME = 'agrib2b-v2';
const OFFLINE_URL = '/offline.html';

// Fichiers à mettre en cache au premier chargement
const PRECACHE_URLS = [
  '/',
  '/login',
  '/register',
  '/offline.html',
];

// ─── Installation ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// ─── Activation et nettoyage des anciens caches ────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ─── Stratégie réseau : Network first, fallback to cache ──────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// ─── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'AgriB2B', body: 'Nouvelle notification', url: '/dashboard/notifications', icon: '/icons/android-chrome-192x192.png', badge: '/icons/badge-72x72.png' };

  if (event.data) {
    try {
      data = { ...data, ...JSON.parse(event.data.text()) };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body:             data.body,
    icon:             data.icon  || '/icons/android-chrome-192x192.png',
    badge:            data.badge || '/icons/badge-72x72.png',
    vibrate:          [200, 100, 200],
    tag:              'agrib2b-notification',
    renotify:         true,
    requireInteraction: false,
    data: { url: data.url || '/dashboard/notifications' },
    actions: [
      { action: 'open',    title: 'Voir',     icon: '/icons/check.png'  },
      { action: 'dismiss', title: 'Ignorer',  icon: '/icons/close.png'  },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ─── Clic sur la notification ──────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url)
    ? event.notification.data.url
    : '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si l'app est déjà ouverte, la mettre en avant et naviguer
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(targetUrl);
          return;
        }
      }
      // Sinon ouvrir un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Changement d'abonnement ───────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // L'abonnement a expiré — on le renouvelle automatiquement
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription
        ? event.oldSubscription.options.applicationServerKey
        : null,
    }).then((newSubscription) => {
      // Envoyer le nouvel abonnement au backend via postMessage
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED', subscription: newSubscription.toJSON() });
        });
      });
    })
  );
});
