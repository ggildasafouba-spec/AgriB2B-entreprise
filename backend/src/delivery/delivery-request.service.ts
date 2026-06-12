import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Tarif de base par km (FCFA)
const BASE_RATE_PER_KM = 100;
const MIN_DELIVERY_PRICE = 500;

@Injectable()
export class DeliveryRequestService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le prix estimé basé sur la distance
   */
  calculateEstimatedPrice(distanceKm: number): number {
    const price = Math.round(distanceKm * BASE_RATE_PER_KM);
    return Math.max(price, MIN_DELIVERY_PRICE);
  }

  /**
   * Acheteur crée une demande de livraison
   */
  async createRequest(buyerId: string, data: {
    orderId: string;
    pickupAddress: string;
    deliveryAddress: string;
    distanceKm?: number;
    proposedPrice?: number;
    description?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== buyerId) throw new ForbiddenException('Non autorisé');

    // Vérifier qu'il n'y a pas déjà une demande
    const existing = await this.prisma.deliveryRequest.findUnique({ where: { orderId: data.orderId } });
    if (existing) throw new BadRequestException('Une demande de livraison existe déjà pour cette commande');

    const estimatedPrice = data.distanceKm
      ? this.calculateEstimatedPrice(data.distanceKm)
      : MIN_DELIVERY_PRICE;

    const request = await this.prisma.deliveryRequest.create({
      data: {
        orderId: data.orderId,
        buyerId,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        distanceKm: data.distanceKm,
        estimatedPrice,
        proposedPrice: data.proposedPrice,
        description: data.description,
        status: 'OPEN',
      },
    });

    // Notifier tous les transporteurs
    const transporters = await this.prisma.user.findMany({
      where: { role: 'TRANSPORTER' },
      select: { id: true },
    });

    if (transporters.length > 0) {
      await this.prisma.notification.createMany({
        data: transporters.map(t => ({
          userId: t.id,
          title: '🚗 Nouvelle demande de livraison',
          message: `${data.pickupAddress} → ${data.deliveryAddress}${data.distanceKm ? ` (${data.distanceKm} km)` : ''}. Prix proposé : ${(data.proposedPrice || estimatedPrice).toLocaleString('fr-FR')} FCFA.`,
        })),
      });
    }

    return request;
  }

  /**
   * Liste des demandes ouvertes (pour les transporteurs)
   */
  async getOpenRequests() {
    return this.prisma.deliveryRequest.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mes demandes (pour l'acheteur)
   */
  async getMyRequests(buyerId: string) {
    return this.prisma.deliveryRequest.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Transporteur accepte une demande
   */
  async acceptRequest(requestId: string, transporterId: string, acceptedPrice?: number) {
    const request = await this.prisma.deliveryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.status !== 'OPEN') throw new BadRequestException('Cette demande n\'est plus disponible');

    const finalPrice = acceptedPrice || request.proposedPrice || request.estimatedPrice;

    const updated = await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        acceptedById: transporterId,
        acceptedPrice: finalPrice,
      },
    });

    // Notifier l'acheteur
    const transporter = await this.prisma.user.findUnique({ where: { id: transporterId }, select: { name: true, phone: true } });
    await this.prisma.notification.create({
      data: {
        userId: request.buyerId,
        title: '✅ Livraison acceptée',
        message: `${transporter?.name} a accepté votre demande de livraison pour ${finalPrice.toLocaleString('fr-FR')} FCFA. Il vous contactera bientôt.`,
      },
    });

    // Ajouter les frais au total de la commande
    const order = await this.prisma.order.findUnique({ where: { id: request.orderId } });
    if (order) {
      const newTotal = Math.round((order.totalPrice + finalPrice) * 100) / 100;
      await this.prisma.order.update({
        where: { id: request.orderId },
        data: { totalPrice: newTotal },
      });
    }

    return updated;
  }

  /**
   * Annuler une demande (acheteur)
   */
  async cancelRequest(requestId: string, buyerId: string) {
    const request = await this.prisma.deliveryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.buyerId !== buyerId) throw new ForbiddenException('Non autorisé');
    if (request.status !== 'OPEN') throw new BadRequestException('Impossible d\'annuler une demande déjà acceptée');

    return this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  }
}
