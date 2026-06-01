import { useEffect } from 'react';
import api from './api';

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = (isAuthenticated) => {
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js');

        // Check existing subscription
        let sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Already subscribed — just save to server (in case of re-login)
          await api.post('/push/subscribe', { subscription: sub }).catch(() => {});
          return;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Get VAPID public key from server
        const { data } = await api.get('/push/vapid-public-key');
        if (!data.publicKey) return;

        // Subscribe
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });

        // Save subscription to server
        await api.post('/push/subscribe', { subscription: sub });
      } catch (err) {
        console.error('Push setup error:', err.message);
      }
    };

    setup();
  }, [isAuthenticated]);
};
