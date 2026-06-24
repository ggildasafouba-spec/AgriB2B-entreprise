import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from '../push/push.service';
import { NotchPayService } from '../payments/notchpay.service';

// Tarif de base par km (FCFA)
const BASE_RATE_PER_KM = 100;
const MIN_DELIVERY_PRICE = 500;
const TRANSPORT_COMMISSION_RATE = 0.03; // 3% commission plateforme sur livraison

@Injectable()
export class DeliveryRequestService {
  private readonly logger = new Logger(DeliveryRequestService.name);

  constructor(
    private prisma: PrismaService,
    private pushService: PushService,
    private notchPay: NotchPayService,
  ) {}

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

    const basePrice = acceptedPrice || request.proposedPrice || request.estimatedPrice;
    // Appliquer la commission plateforme de 3% sur la livraison
    const commission = Math.round(basePrice * TRANSPORT_COMMISSION_RATE * 100) / 100;
    const finalPrice = Math.round((basePrice + commission) * 100) / 100;
    const transporterAmount = basePrice; // Le transporteur reçoit le prix de base (hors commission)

    // Vérifier si la commande est déjà payée
    const order = await this.prisma.order.findUnique({
      where: { id: request.orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    const alreadyPaid = order.payment?.status === 'SUCCESS';

    const updated = await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        acceptedById: transporterId,
        acceptedPrice: finalPrice,
        // Si déjà payé, marquer le paiement livraison comme en attente
        paymentStatus: alreadyPaid ? 'PENDING' : null,
      },
    });

    // Mettre à jour le total de la commande
    const newTotal = Math.round((order.totalPrice + finalPrice) * 100) / 100;
    await this.prisma.order.update({
      where: { id: request.orderId },
      data: {
        totalPrice: newTotal,
        deliveryCostIncluded: finalPrice,
      },
    });

    // Mettre à jour l'escrow
    const escrow = await this.prisma.escrow.findUnique({ where: { orderId: request.orderId } });
    if (escrow) {
      await this.prisma.escrow.update({
        where: { orderId: request.orderId },
        data: {
          amount: newTotal,
          commission: Math.round((escrow.commission + commission) * 100) / 100,
        },
      });
    }

    // Notifier l'acheteur
    const transporter = await this.prisma.user.findUnique({ where: { id: transporterId }, select: { name: true, phone: true } });

    if (alreadyPaid) {
      // Commande déjà payée → notification pour payer la livraison séparément
      await this.prisma.notification.create({
        data: {
          userId: request.buyerId,
          title: '🚗 Livraison acceptée — Paiement requis',
          message: `${transporter?.name} a accepté votre livraison. Payez ${finalPrice.toLocaleString('fr-FR')} FCFA pour la livraison (dont ${commission.toLocaleString('fr-FR')} FCFA de frais de service).`,
        },
      });
      this.pushService.sendToUser(request.buyerId, {
        title: '🚗 Livraison acceptée — Paiement requis',
        body: `Payez ${finalPrice.toLocaleString('fr-FR')} FCFA pour votre livraison. ${transporter?.name} est prêt.`,
        url: '/dashboard/orders',
      }).catch(() => {});
    } else {
      // Commande pas encore payée → notification classique
      await this.prisma.notification.create({
        data: {
          userId: request.buyerId,
          title: '✅ Livraison acceptée',
          message: `${transporter?.name} a accepté votre demande de livraison pour ${finalPrice.toLocaleString('fr-FR')} FCFA (dont ${commission.toLocaleString('fr-FR')} FCFA de frais de service). Le montant sera inclus dans votre paiement.`,
        },
      });
      this.pushService.sendToUser(request.buyerId, {
        title: '✅ Livraison acceptée',
        body: `${transporter?.name} a accepté. ${finalPrice.toLocaleString('fr-FR')} FCFA ajoutés au total de votre commande.`,
        url: '/dashboard/orders',
      }).catch(() => {});
    }

    return updated;
  }

  /**
   * Annuler une demande (acheteur)
   * Possible tant que la livraison n'a pas été payée
   */
  async cancelRequest(requestId: string, buyerId: string) {
    const request = await this.prisma.deliveryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Demande introuvable');
    if (request.buyerId !== buyerId) throw new ForbiddenException('Non autorisé');
    if (request.paymentStatus === 'SUCCESS') {
      throw new BadRequestException('Impossible d\'annuler une livraison déjà payée');
    }

    const wasAccepted = request.status === 'ACCEPTED';
    const transporterId = request.acceptedById;

    // Annuler la demande
    await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED', paymentStatus: null },
    });

    // Si la demande avait été acceptée, retirer les frais de livraison du total
    if (wasAccepted && request.acceptedPrice) {
      const order = await this.prisma.order.findUnique({
        where: { id: request.orderId },
        include: { seller: true },
      });
      if (order) {
        // Montant produits seul = total actuel - frais livraison
        const productTotal = Math.max(0, Math.round((order.totalPrice - request.acceptedPrice) * 100) / 100);
        await this.prisma.order.update({
          where: { id: request.orderId },
          data: {
            totalPrice: productTotal,
            deliveryCostIncluded: 0,
          },
        });

        // Recalculer l'escrow : commission uniquement sur produits, plus de livraison
        const escrow = await this.prisma.escrow.findUnique({ where: { orderId: request.orderId } });
        if (escrow) {
          const sellerRate = order.seller?.accountType === 'COMPANY' ? 0.10 : 0.05;
          const productCommission = Math.round(productTotal * sellerRate * 100) / 100;
          const sellerAmount = Math.round((productTotal - productCommission) * 100) / 100;
          await this.prisma.escrow.update({
            where: { orderId: request.orderId },
            data: {
              amount: productTotal,
              commission: productCommission,
              sellerAmount,
            },
          });
        }
      }

      // Notifier le transporteur que la demande est annulée
      if (transporterId) {
        await this.prisma.notification.create({
          data: {
            userId: transporterId,
            title: '❌ Livraison annulée',
            message: `L'acheteur a annulé la demande de livraison ${request.pickupAddress} → ${request.deliveryAddress}. Vous n'avez plus à effectuer cette course.`,
          },
        });
        this.pushService.sendToUser(transporterId, {
          title: '❌ Livraison annulée',
          body: `La livraison ${request.pickupAddress} → ${request.deliveryAddress} a été annulée par l'acheteur.`,
          url: '/dashboard/delivery-requests',
        }).catch(() => {});
      }
    }

    // Si la demande était encore OPEN, notifier les transporteurs n'est pas nécessaire
    // (personne ne l'avait acceptée)

    return { message: 'Demande de livraison annulée' };
  }

  /**
   * Payer la livraison séparément (quand la commande est déjà payée)
   */
  async payDeliveryRequest(requestId: string, buyerId: string, data: { provider: string; phone: string }) {
    const request = await this.prisma.deliveryRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Demande de livraison introuvable');
    if (request.buyerId !== buyerId) throw new ForbiddenException('Non autorisé');
    if (request.status !== 'ACCEPTED') throw new BadRequestException('Cette demande n\'est pas encore acceptée');
    if (request.paymentStatus === 'SUCCESS') throw new BadRequestException('La livraison est déjà payée');

    if (!data.phone?.trim()) {
      throw new BadRequestException('Le numéro de téléphone est requis');
    }

    const amount = request.acceptedPrice || 0;
    if (amount <= 0) throw new BadRequestException('Montant invalide');

    // Paiement manuel (virement)
    if (data.provider === 'MANUAL') {
      const ref = `DEL-${Date.now()}-${requestId.slice(0, 8).toUpperCase()}`;
      await this.prisma.deliveryRequest.update({
        where: { id: requestId },
        data: { paymentStatus: 'PENDING', paymentRef: ref },
      });

      return {
        success: true,
        message: `Virement de ${amount.toLocaleString('fr-FR')} FCFA enregistré pour la livraison. Réf: ${ref}`,
        transactionId: ref,
        amount,
      };
    }

    // Paiement Mobile Money via NotchPay
    const buyer = await this.prisma.user.findUnique({ where: { id: buyerId } });
    const backendUrl = process.env.BACKEND_URL || (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'http://localhost:4000');
    const callbackUrl = `${backendUrl}/delivery/request/${requestId}/payment-callback`;
    const reference = `del-${requestId.slice(0, 8)}-${Date.now()}`;

    const notchPayResult = await this.notchPay.initializePayment({
      amount,
      currency: 'XAF',
      customerName: buyer?.name || 'Client',
      customerEmail: buyer?.email || '',
      customerPhone: data.phone,
      description: `Livraison commande #${request.orderId.slice(0, 8)} — AgriB2B`,
      reference,
      callbackUrl,
    });

    const paymentRef = notchPayResult.notchpayReference || reference;

    // Envoyer le prompt USSD si possible
    if (notchPayResult.notchpayReference && !notchPayResult.simulated) {
      const channel = this.notchPay.getChannelForProvider(data.provider);
      try {
        await this.notchPay.directCharge(notchPayResult.notchpayReference, {
          channel,
          phone: data.phone,
        });
        this.logger.log(`Direct charge livraison envoyé à ${data.phone} via ${channel}`);
      } catch (err: any) {
        this.logger.warn(`Direct charge livraison échoué: ${err.message}`);
      }
    }

    // Sauvegarder la référence
    await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: { paymentStatus: 'PENDING', paymentRef },
    });

    return {
      success: true,
      message: notchPayResult.authorization_url
        ? 'Paiement initié. Complétez le paiement sur la page de paiement.'
        : `Paiement de ${amount.toLocaleString('fr-FR')} FCFA initié. Validez sur votre téléphone.`,
      transactionId: paymentRef,
      paymentUrl: notchPayResult.authorization_url || null,
      amount,
    };
  }

  /**
   * Confirmer le paiement d'une livraison (appelé par webhook ou manuellement)
   */
  async confirmDeliveryPayment(requestId: string, status: 'SUCCESS' | 'FAILED') {
    const request = await this.prisma.deliveryRequest.findUnique({ where: { id: requestId } });
    if (!request) return;

    await this.prisma.deliveryRequest.update({
      where: { id: requestId },
      data: { paymentStatus: status },
    });

    if (status === 'SUCCESS') {
      await this.prisma.notification.create({
        data: {
          userId: request.buyerId,
          title: '✅ Paiement livraison confirmé',
          message: `Votre paiement de ${(request.acceptedPrice || 0).toLocaleString('fr-FR')} FCFA pour la livraison a été confirmé.`,
        },
      });
      this.pushService.sendToUser(request.buyerId, {
        title: '✅ Paiement livraison confirmé',
        body: `${(request.acceptedPrice || 0).toLocaleString('fr-FR')} FCFA confirmé. Votre livraison est en route.`,
        url: '/dashboard/orders',
      }).catch(() => {});

      // Notifier le transporteur aussi
      if (request.acceptedById) {
        await this.prisma.notification.create({
          data: {
            userId: request.acceptedById,
            title: '💰 Paiement livraison reçu',
            message: `L'acheteur a payé la livraison. Vous pouvez procéder.`,
          },
        });
        this.pushService.sendToUser(request.acceptedById, {
          title: '💰 Paiement livraison reçu',
          body: 'L\'acheteur a payé. Vous pouvez procéder à la livraison.',
          url: '/dashboard/delivery-requests',
        }).catch(() => {});
      }
    } else {
      await this.prisma.notification.create({
        data: {
          userId: request.buyerId,
          title: '❌ Paiement livraison échoué',
          message: `Le paiement de votre livraison a échoué. Veuillez réessayer.`,
        },
      });
    }
  }
}
