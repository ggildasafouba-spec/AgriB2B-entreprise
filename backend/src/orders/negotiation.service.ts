import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NegotiationService {
  constructor(private prisma: PrismaService) {}

  async create(buyerId: string, data: { productId: string; proposedPrice: number; quantity: number; message?: string }) {
    const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.sellerId === buyerId) throw new BadRequestException('Vous ne pouvez pas négocier votre propre produit');

    const negotiation = await this.prisma.negotiation.create({
      data: {
        productId: data.productId,
        buyerId,
        sellerId: product.sellerId,
        originalPrice: product.price,
        proposedPrice: data.proposedPrice,
        quantity: data.quantity,
        messages: data.message ? {
          create: { senderId: buyerId, content: data.message, proposedPrice: data.proposedPrice },
        } : undefined,
      },
      include: { messages: true },
    });

    await this.prisma.notification.create({
      data: {
        userId: product.sellerId,
        title: '💬 Nouvelle proposition de prix',
        message: `Un acheteur propose ${data.proposedPrice.toLocaleString('fr-FR')} FCFA au lieu de ${product.price.toLocaleString('fr-FR')} FCFA pour ${product.name} (${data.quantity} unités).`,
      },
    });

    return negotiation;
  }

  async respond(negotiationId: string, userId: string, data: { action: string; counterPrice?: number; message?: string }) {
    const negotiation = await this.prisma.negotiation.findUnique({ where: { id: negotiationId } });
    if (!negotiation) throw new NotFoundException('Négociation introuvable');
    if (negotiation.sellerId !== userId && negotiation.buyerId !== userId) throw new ForbiddenException('Accès refusé');

    let status: string;
    let finalPrice: number | null = null;

    switch (data.action) {
      case 'ACCEPTED':
        status = 'ACCEPTED';
        finalPrice = negotiation.counterPrice || negotiation.proposedPrice;
        break;
      case 'REJECTED':
        status = 'REJECTED';
        break;
      case 'COUNTER':
        if (!data.counterPrice) throw new BadRequestException('Prix de contre-proposition requis');
        status = 'COUNTER';
        break;
      default:
        throw new BadRequestException('Action invalide');
    }

    const updated = await this.prisma.negotiation.update({
      where: { id: negotiationId },
      data: {
        status: status as any,
        counterPrice: data.counterPrice || negotiation.counterPrice,
        finalPrice,
        messages: data.message || data.counterPrice ? {
          create: {
            senderId: userId,
            content: data.message || (data.action === 'COUNTER' ? `Contre-proposition : ${data.counterPrice} FCFA` : data.action === 'ACCEPTED' ? 'Proposition acceptée' : 'Proposition refusée'),
            proposedPrice: data.counterPrice,
          },
        } : undefined,
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    // Notifier l'autre partie
    const notifyUserId = userId === negotiation.buyerId ? negotiation.sellerId : negotiation.buyerId;
    const actionLabel = data.action === 'ACCEPTED' ? 'accepté votre proposition' : data.action === 'REJECTED' ? 'refusé votre proposition' : `fait une contre-proposition à ${data.counterPrice} FCFA`;
    await this.prisma.notification.create({
      data: {
        userId: notifyUserId,
        title: '💬 Réponse à votre négociation',
        message: `L'utilisateur a ${actionLabel}.`,
      },
    });

    return updated;
  }

  async getMyNegotiations(userId: string) {
    return this.prisma.negotiation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getOne(id: string, userId: string) {
    const negotiation = await this.prisma.negotiation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!negotiation) throw new NotFoundException('Négociation introuvable');
    if (negotiation.buyerId !== userId && negotiation.sellerId !== userId) throw new ForbiddenException('Accès refusé');
    return negotiation;
  }
}
