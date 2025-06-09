'use client';

import { useEffect } from 'react';
import * as serviceWorkerRegistration from '../lib/pwa/register';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Register the service worker
      serviceWorkerRegistration.register({
        onSuccess: (registration) => {
          console.log('PWA registration successful', registration);
          
          // Request permission for notifications
          if ('Notification' in window) {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                console.log('Notification permission granted');
              }
            });
          }
        },
        onUpdate: (registration) => {
          console.log('New content is available; please refresh.', registration);
        }
      });
    }
  }, []);

  return null;
}
