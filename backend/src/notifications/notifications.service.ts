import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
  ) {}

  // ─── Créer une notification en BDD ET envoyer un push ─────────────────────
  async create(userId: string, title: string, message: string, url?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, message },
    });

    // Envoyer la push notification (ne bloque pas si désactivée)
    this.pushService.sendToUser(userId, { title, body: message, url }).catch(() => {});

    return notification;
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, read: false } });
    return { count };
  }
}
