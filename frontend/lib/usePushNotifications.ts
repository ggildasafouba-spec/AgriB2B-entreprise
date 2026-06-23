'use client';
import { useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Convertit une clé VAPID base64url en Uint8Array pour PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/**
 * Hook qui :
 * 1. Enregistre le service worker
 * 2. Demande la permission de notifications
 * 3. S'abonne au push et envoie la subscription au backend
 * 4. Gère le renouvellement automatique (pushsubscriptionchange)
 */
export function usePushNotifications(token: string | null) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!token || subscribedRef.current) return;
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    subscribedRef.current = true;

    (async () => {
      try {
        // 1. Récupérer la clé VAPID publique
        const { data } = await axios.get(`${API_URL}/push/vapid-public-key`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const vapidPublicKey: string = data.publicKey;
        if (!vapidPublicKey) return; // Push non configuré côté serveur

        // 2. Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // 3. Vérifier la permission
        if (Notification.permission === 'denied') return;

        let permission = Notification.permission;
        if (permission === 'default') {
          permission = await Notification.requestPermission();
        }
        if (permission !== 'granted') return;

        // 4. Vérifier si déjà abonné
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          // Envoyer la sub existante au backend (idempotent)
          await sendSubscriptionToBackend(existingSub, token);
          return;
        }

        // 5. Créer un nouvel abonnement
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });

        await sendSubscriptionToBackend(subscription, token);

        // 6. Écouter les renouvellements (pushsubscriptionchange depuis SW)
        navigator.serviceWorker.addEventListener('message', async (event) => {
          if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
            await sendSubscriptionToBackend(event.data.subscription, token);
          }
        });

      } catch (err) {
        // Silencieux — ne pas bloquer l'app si push indisponible
        console.warn('[Push] Abonnement impossible:', err);
      }
    })();
  }, [token]);
}

async function sendSubscriptionToBackend(
  subscription: PushSubscription | { endpoint: string; keys: { p256dh: string; auth: string } },
  token: string,
) {
  const sub = subscription instanceof PushSubscription
    ? subscription.toJSON()
    : subscription;

  await axios.post(
    `${API_URL}/push/subscribe`,
    {
      endpoint: sub.endpoint,
      keys: {
        p256dh: (sub as any).keys?.p256dh,
        auth:   (sub as any).keys?.auth,
      },
    },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
