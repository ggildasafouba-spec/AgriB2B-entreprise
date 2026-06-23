import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Options de qualité de service adaptées aux produits agricoles au Cameroun :
 *
 * EXPRESS (1-2 jours) : Pour les produits très périssables (tomates, laitue, fruits mûrs)
 *   - Véhicule dédié, départ immédiat
 *   - Idéal pour les circuits courts (Douala-Yaoundé, intra-ville)
 *   - Surcoût : +50% sur le tarif standard
 *
 * STANDARD (2-4 jours) : Pour la majorité des produits (légumes, tubercules, céréales)
 *   - Groupage avec d'autres colis pour optimiser les coûts
 *   - Bon rapport qualité/prix pour les distances moyennes
 *   - Tarif de base
 *
 * ECONOMIQUE (4-7 jours) : Pour les produits non périssables (céréales, légumineuses, épices)
 *   - Transport mutualisé, départ quand le camion est plein
 *   - Idéal pour les grosses quantités sur longues distances
 *   - Réduction : -20% sur le tarif standard
 *
 * FRIGORIFIQUE (1-3 jours) : Pour les produits sensibles à la chaleur
 *   - Camion réfrigéré ou isotherme
 *   - Indispensable pour : viande, poisson, produits laitiers, fruits fragiles
 *   - Surcoût : +80% sur le tarif standard
 */

const SERVICE_MULTIPLIERS = {
  EXPRESS: 1.5,
  STANDARD: 1.0,
  ECONOMIQUE: 0.8,
  FRIGORIFIQUE: 1.8,
};

const TRANSPORT_COMMISSION_RATE = 0.03; // 3%

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcule le coût de livraison pour une commande
   */
  async calculateDeliveryCost(data: {
    transportRateId: string;
    weight: number;
    serviceType: string;
  }) {
    const rate = await this.prisma.transportRate.findUnique({
      where: { id: data.transportRateId },
      include: { transporter: { select: { id: true, name: true, phone: true } } },
    });

    if (!rate) throw new NotFoundException('Tarif de transport introuvable');
    if (!rate.isActive) throw new BadRequestException('Ce tarif n\'est plus disponible');

    const multiplier = SERVICE_MULTIPLIERS[data.serviceType] || 1.0;
    const baseCost = rate.pricePerKg * data.weight * multiplier;
    const commission = Math.round(baseCost * TRANSPORT_COMMISSION_RATE * 100) / 100;
    const totalCost = Math.round((baseCost + commission) * 100) / 100;
    const transporterAmount = Math.round(baseCost * 100) / 100;

    const estimatedDays = rate.estimatedDays
      ? Math.ceil(rate.estimatedDays * (data.serviceType === 'EXPRESS' ? 0.5 : data.serviceType === 'ECONOMIQUE' ? 1.5 : 1))
      : null;

    return {
      transportRateId: rate.id,
      transporterId: rate.transporterId,
      transporter: rate.transporter,
      origin: rate.origin,
      destination: rate.destination,
      serviceType: data.serviceType,
      weight: data.weight,
      baseCost,
      commission,
      totalCost,
      transporterAmount,
      estimatedDays,
      vehicleType: rate.vehicleType,
    };
  }

  /**
   * Crée une livraison simple (sans transporteur externe)
   * Utilisé pour les livraisons à domicile / points relais avec tarif fixe
   */
  async createSimpleDelivery(data: {
    orderId: string;
    deliveryAddress: string;
    recipientPhone: string;
    deliveryCost: number;
    label: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: data.orderId }, select: { id: true, totalPrice: true, buyerId: true, sellerId: true } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const existing = await this.prisma.delivery.findUnique({ where: { orderId: data.orderId } });
    if (existing) throw new BadRequestException('Une livraison existe déjà pour cette commande');

    // Créer la livraison (le vendeur fait la livraison lui-même)
    const delivery = await this.prisma.delivery.create({
      data: {
        orderId: data.orderId,
        transporterId: order.sellerId, // Le vendeur assure la livraison
        origin: 'Vendeur',
        destination: data.deliveryAddress,
        serviceType: 'STANDARD',
        deliveryCost: data.deliveryCost,
        commission: 0, // Pas de commission transport sur livraison directe
        transporterAmount: data.deliveryCost,
        deliveryAddress: data.deliveryAddress,
        recipientName: '',
        recipientPhone: data.recipientPhone,
        status: 'ACCEPTED',
        trackingEvents: {
          create: {
            status: 'ACCEPTED',
            description: `Livraison ${data.label} — ${data.deliveryAddress}`,
          },
        },
      },
      include: { trackingEvents: true },
    });

    // Additionner les frais de livraison au total de la commande
    const newTotalPrice = Math.round((order.totalPrice + data.deliveryCost) * 100) / 100;
    await this.prisma.order.update({
      where: { id: data.orderId },
      data: {
        totalPrice: newTotalPrice,
        deliveryCostIncluded: data.deliveryCost,
      },
    });

    // Mettre à jour l'escrow si existant
    const escrow = await this.prisma.escrow.findUnique({ where: { orderId: data.orderId } });
    if (escrow) {
      await this.prisma.escrow.update({
        where: { orderId: data.orderId },
        data: { amount: newTotalPrice },
      });
    }

    // Notifier
    await this.prisma.notification.create({
      data: {
        userId: order.buyerId,
        title: '🚚 Livraison ajoutée',
        message: `${data.label} — +${data.deliveryCost.toLocaleString('fr-FR')} FCFA. Nouveau total : ${newTotalPrice.toLocaleString('fr-FR')} FCFA.`,
      },
    });

    return delivery;
  }

  /**
   * Crée une livraison pour une commande
   */
  async createDelivery(orderId: string, data: {
    transportRateId: string;
    weight: number;
    serviceType: string;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { id: true, totalPrice: true, buyerId: true } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const existing = await this.prisma.delivery.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Une livraison existe déjà pour cette commande');

    const cost = await this.calculateDeliveryCost({
      transportRateId: data.transportRateId,
      weight: data.weight,
      serviceType: data.serviceType,
    });

    const estimatedDate = cost.estimatedDays
      ? new Date(Date.now() + cost.estimatedDays * 24 * 60 * 60 * 1000)
      : null;

    const delivery = await this.prisma.delivery.create({
      data: {
        orderId,
        transportRateId: data.transportRateId,
        transporterId: cost.transporterId,
        origin: cost.origin,
        destination: cost.destination,
        serviceType: data.serviceType as any,
        weight: data.weight,
        deliveryCost: cost.totalCost,
        commission: cost.commission,
        transporterAmount: cost.transporterAmount,
        deliveryAddress: data.deliveryAddress,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        estimatedDate,
        trackingEvents: {
          create: {
            status: 'PENDING',
            description: 'Livraison créée — en attente de prise en charge par le transporteur',
          },
        },
      },
      include: { trackingEvents: true },
    });

    // ─── Additionner les frais de livraison au totalPrice de la commande ─────
    // L'acheteur paie un seul montant : produits + livraison
    const newTotalPrice = Math.round((order.totalPrice + cost.totalCost) * 100) / 100;
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        totalPrice: newTotalPrice,
        deliveryCostIncluded: cost.totalCost,
      },
    });

    // Mettre à jour l'escrow si existant (recalculer avec le nouveau total)
    const escrow = await this.prisma.escrow.findUnique({ where: { orderId } });
    if (escrow) {
      // La commission plateforme ne s'applique qu'aux produits (pas à la livraison)
      // L'escrow garde le montant produits + commission produits inchangés
      // Les frais de livraison sont gérés séparément (payout au transporteur)
      await this.prisma.escrow.update({
        where: { orderId },
        data: { amount: newTotalPrice },
      });
    }

    // Notifier l'acheteur
    await this.prisma.notification.create({
      data: {
        userId: order.buyerId,
        title: '🚛 Livraison ajoutée à votre commande',
        message: `Frais de livraison : ${cost.totalCost.toLocaleString('fr-FR')} FCFA ajoutés. Nouveau total à payer : ${newTotalPrice.toLocaleString('fr-FR')} FCFA.`,
      },
    });

    // Notifier le transporteur
    await this.prisma.notification.create({
      data: {
        userId: cost.transporterId,
        title: '📦 Nouvelle livraison à prendre en charge',
        message: `Livraison ${cost.origin} → ${cost.destination} (${data.weight}kg, ${data.serviceType}). Montant : ${cost.transporterAmount.toLocaleString('fr-FR')} FCFA.`,
      },
    });

    return delivery;
  }

  /**
   * Met à jour le statut de livraison (par le transporteur)
   */
  async updateStatus(deliveryId: string, transporterId: string, data: {
    status: string;
    location?: string;
    description?: string;
    photoUrl?: string;
  }) {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Livraison introuvable');
    if (delivery.transporterId !== transporterId) throw new ForbiddenException('Accès refusé');

    const descriptions = {
      ACCEPTED: 'Livraison acceptée par le transporteur',
      PICKED_UP: 'Colis récupéré chez le vendeur',
      IN_TRANSIT: 'Colis en transit',
      ARRIVED_CITY: 'Colis arrivé dans la ville de destination',
      OUT_FOR_DELIVERY: 'Colis en cours de livraison',
      DELIVERED: 'Colis livré avec succès',
      FAILED: 'Échec de livraison',
      RETURNED: 'Colis retourné à l\'expéditeur',
    };

    const updateData: any = { status: data.status };
    if (data.status === 'PICKED_UP') updateData.pickedUpAt = new Date();
    if (data.status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updated = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
    });

    // Ajouter l'événement de tracking (avec photo si fournie)
    const trackingDescription = data.description || descriptions[data.status] || `Statut mis à jour : ${data.status}`;
    const fullDescription = data.photoUrl
      ? `${trackingDescription} [PHOTO:${data.photoUrl}]`
      : trackingDescription;

    await this.prisma.deliveryTracking.create({
      data: {
        deliveryId,
        status: data.status as any,
        location: data.location,
        description: fullDescription,
      },
    });

    // Notifier l'acheteur
    const order = await this.prisma.order.findUnique({ where: { id: delivery.orderId } });
    if (order) {
      const photoMsg = data.photoUrl ? ' (📷 photo jointe)' : '';
      await this.prisma.notification.create({
        data: {
          userId: order.buyerId,
          title: `🚚 Mise à jour livraison`,
          message: (descriptions[data.status] || `Statut : ${data.status}`) + photoMsg,
        },
      });
    }

    return updated;
  }

  /**
   * Récupère le suivi d'une livraison
   */
  async getTracking(orderId: string, userId: string, role: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      include: {
        trackingEvents: { orderBy: { createdAt: 'asc' } },
        order: { select: { buyerId: true, sellerId: true } },
      },
    });

    if (!delivery) throw new NotFoundException('Aucune livraison pour cette commande');

    // Vérifier l'accès
    if (role !== 'ADMIN' &&
        delivery.order.buyerId !== userId &&
        delivery.order.sellerId !== userId &&
        delivery.transporterId !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return delivery;
  }

  /**
   * Livraisons du transporteur
   */
  async getTransporterDeliveries(transporterId: string) {
    return this.prisma.delivery.findMany({
      where: { transporterId },
      include: {
        order: {
          select: {
            id: true,
            totalPrice: true,
            buyer: { select: { name: true, phone: true } },
            seller: { select: { name: true, phone: true, region: true } },
          },
        },
        trackingEvents: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Options de service disponibles avec descriptions
   */
  getServiceOptions() {
    return [
      {
        type: 'EXPRESS',
        name: 'Express',
        description: 'Livraison rapide (1-2 jours). Véhicule dédié, départ immédiat.',
        ideal: 'Produits très périssables : tomates, laitue, fruits mûrs',
        multiplier: 1.5,
        icon: '⚡',
      },
      {
        type: 'STANDARD',
        name: 'Standard',
        description: 'Livraison normale (2-4 jours). Bon rapport qualité/prix.',
        ideal: 'Légumes, tubercules, céréales en quantité moyenne',
        multiplier: 1.0,
        icon: '🚛',
      },
      {
        type: 'ECONOMIQUE',
        name: 'Économique',
        description: 'Livraison économique (4-7 jours). Transport mutualisé.',
        ideal: 'Produits non périssables : céréales, légumineuses, épices',
        multiplier: 0.8,
        icon: '💰',
      },
      {
        type: 'FRIGORIFIQUE',
        name: 'Frigorifique',
        description: 'Transport réfrigéré (1-3 jours). Chaîne du froid maintenue.',
        ideal: 'Produits sensibles : viande, poisson, produits laitiers',
        multiplier: 1.8,
        icon: '❄️',
      },
    ];
  }
}
