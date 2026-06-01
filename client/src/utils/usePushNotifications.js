import { useEffect, useRef } from 'react';
import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = (isAuthenticated) => {
  const setupDone = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) { setupDone.current = false; return; }
    if (setupDone.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push not supported in this browser');
      return;
    }

    const setup = async () => {
      try {
        // Register (or get existing) service worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        await navigator.serviceWorker.ready;

        // Request notification permission first
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }

        // Check if already subscribed
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          // Get VAPID public key from server
          const { data } = await api.get('/push/vapid-public-key');
          if (!data?.publicKey) {
            console.error('No VAPID public key from server');
            return;
          }

          // Create new subscription
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
          });
        }

        // Save subscription to server
        await api.post('/push/subscribe', { subscription: sub });
        setupDone.current = true;
        console.log('✅ Push notifications enabled');
      } catch (err) {
        console.error('Push setup error:', err.message);
      }
    };

    setup();
  }, [isAuthenticated]);
};
