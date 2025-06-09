// RunAlert Service Worker
const CACHE_NAME = 'runalert-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sounds/notification-info.ogg',
  '/sounds/notification-warning.wav',
  '/sounds/notification-critical.ogg',
  '/sounds/notification-announcement.wav',
  '/sounds/message-read.wav'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
    );
  }
});

// Background sync for message processing
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Sync event:', event.tag);
  if (event.tag === 'process-messages') {
    event.waitUntil(processMessagesInBackground());
  }
});

// Set up periodic background checks
// This is crucial for when the app is in the background or the phone is locked
let periodicSyncRegistered = false;

self.addEventListener('activate', event => {
  // Register periodic sync if supported
  if ('periodicSync' in self.registration) {
    event.waitUntil(
      (async () => {
        try {
          // Check for permission
          const status = await navigator.permissions.query({
            name: 'periodic-background-sync',
          });
          
          if (status.state === 'granted' && !periodicSyncRegistered) {
            // Register periodic sync to check for messages every 15 minutes
            await self.registration.periodicSync.register('message-check', {
              minInterval: 15 * 60 * 1000, // 15 minutes
            });
            periodicSyncRegistered = true;
            console.log('[ServiceWorker] Registered periodic background sync');
          }
        } catch (error) {
          console.error('[ServiceWorker] Periodic sync registration failed:', error);
          // Fall back to using regular sync
          setInterval(() => {
            processMessagesInBackground();
          }, 5 * 60 * 1000); // Check every 5 minutes as fallback
        }
      })()
    );
  } else {
    // If periodicSync is not supported, use setInterval as fallback
    console.log('[ServiceWorker] PeriodicSync not supported, using fallback');
    setInterval(() => {
      processMessagesInBackground();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
});

// Handle periodic sync events
self.addEventListener('periodicsync', event => {
  if (event.tag === 'message-check') {
    console.log('[ServiceWorker] Periodic sync: checking for messages');
    event.waitUntil(processMessagesInBackground());
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received:', event);
  
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[ServiceWorker] Error parsing push data:', e);
    data = {
      title: 'New Alert',
      body: 'You have a new notification',
      priority: 'info'
    };
  }
  
  const title = data.title || 'RunAlert Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    tag: data.id || 'runalert-notification',
    data: {
      priority: data.priority || 'info',
      url: '/'
    }
  };
  
  // Play sound based on priority
  let soundUrl;
  switch (data.priority) {
    case 'critical':
      soundUrl = '/sounds/notification-critical.ogg';
      break;
    case 'warning':
      soundUrl = '/sounds/notification-warning.wav';
      break;
    case 'announcement':
      soundUrl = '/sounds/notification-announcement.wav';
      break;
    default:
      soundUrl = '/sounds/notification-info.ogg';
  }
  
  // Add sound to notification
  options.silent = false;
  options.sound = soundUrl;
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click:', event);
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Function to process messages in background
async function processMessagesInBackground() {
  console.log('[ServiceWorker] Processing messages in background');
  try {
    // Attempt to notify the main thread about new messages
    const allClients = await clients.matchAll({ type: 'window' });
    
    // If there are active clients, send them a message to check for updates
    if (allClients.length > 0) {
      for (const client of allClients) {
        client.postMessage({
          type: 'CHECK_MESSAGES',
          timestamp: Date.now()
        });
      }
    } else {
      // If no clients are active, we need to wake up the app
      // This is crucial for when the phone is locked or app is in background
      console.log('[ServiceWorker] No active clients, attempting to wake up app');
      
      // Try to show a notification to wake up the app
      await self.registration.showNotification('RunAlert Background Update', {
        body: 'Checking for new messages...',
        icon: '/icons/icon-192x192.png',
        tag: 'background-check',
        silent: true, // Don't make sound for background checks
        data: {
          type: 'background-check'
        }
      });
      
      // After a short delay, close the notification
      setTimeout(async () => {
        const notifications = await self.registration.getNotifications({
          tag: 'background-check'
        });
        notifications.forEach(notification => notification.close());
      }, 3000);
    }
    
    return true;
  } catch (error) {
    console.error('[ServiceWorker] Error processing messages:', error);
    return false;
  }
}
