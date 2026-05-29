import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(reviewerId: string, data: { orderId: string; targetId: string; rating: number; comment?: string; type: string }) {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('La note doit être entre 1 et 5');

    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.status !== 'DELIVERED') throw new BadRequestException('Vous ne pouvez noter qu\'après la livraison');

    const existing = await this.prisma.review.findFirst({
      where: { orderId: data.orderId, reviewerId, type: data.type as any },
    });
    if (existing) throw new BadRequestException('Vous avez déjà noté cette transaction');

    const review = await this.prisma.review.create({
      data: {
        orderId: data.orderId,
        reviewerId,
        targetId: data.targetId,
        rating: data.rating,
        comment: data.comment,
        type: data.type as any,
      },
    });

    // Notifier la personne notée
    await this.prisma.notification.create({
      data: {
        userId: data.targetId,
        title: '⭐ Nouvel avis reçu',
        message: `Vous avez reçu une note de ${data.rating}/5${data.comment ? ` : "${data.comment}"` : ''}.`,
      },
    });

    return review;
  }

  async getUserReviews(userId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { targetId: userId },
      orderBy: { createdAt: 'desc' },
    });

    const avgRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    return { reviews, avgRating, totalReviews: reviews.length };
  }

  async getOrderReviews(orderId: string) {
    return this.prisma.review.findMany({ where: { orderId } });
  }
}
