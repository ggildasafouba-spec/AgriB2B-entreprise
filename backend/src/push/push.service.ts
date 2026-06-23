import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    const publicKey  = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const email      = process.env.VAPID_EMAIL || 'mailto:contact@mboamarket.africa';

    if (!publicKey || !privateKey) {
      this.logger.warn('⚠️  Clés VAPID non configurées — les push notifications sont désactivées');
      return;
    }

    webpush.setVapidDetails(email, publicKey, privateKey);
    this.logger.log('✅ Web Push (VAPID) initialisé');
  }

  // ─── Enregistrer ou mettre à jour un abonnement ───────────────────────────
  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth:   subscription.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh:   subscription.keys.p256dh,
        auth:     subscription.keys.auth,
      },
    });
  }

  // ─── Supprimer un abonnement ───────────────────────────────────────────────
  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
  }

  // ─── Envoyer une notification push à un utilisateur ───────────────────────
  async sendToUser(userId: string, payload: { title: string; body: string; url?: string; icon?: string }) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      icon:  payload.icon  || '/icons/android-chrome-192x192.png',
      badge: '/icons/badge-72x72.png',
      url:   payload.url   || '/dashboard/notifications',
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          pushPayload,
        ),
      ),
    );

    // Supprimer les abonnements expirés (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'rejected') {
        const err = result.reason as any;
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          this.logger.warn(`Suppression abonnement expiré: ${subscriptions[i].endpoint.slice(0, 60)}…`);
          await this.prisma.pushSubscription.delete({ where: { id: subscriptions[i].id } }).catch(() => {});
        } else {
          this.logger.error('Erreur push:', err?.message || err);
        }
      }
    }
  }

  // ─── Retourner la clé publique VAPID pour le frontend ─────────────────────
  getPublicKey(): string {
    return process.env.VAPID_PUBLIC_KEY || '';
  }
}
