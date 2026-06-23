import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../common/commission.service';
import { NotchPayService } from './notchpay.service';
import { PushService } from '../push/push.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private notchPay: NotchPayService,
    private pushService: PushService,
  ) {}

  // ─── Initier un paiement MTN, Orange ou virement bancaire ────────────────
  async initiate(dto: InitiatePaymentDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true, delivery: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new BadRequestException('Non autorisé');
    if (order.payment && order.payment.status === 'SUCCESS') {
      throw new ConflictException('Cette commande est déjà payée');
    }

    // ─── Option 2 : Bloquer le paiement si la livraison n'est pas encore définie ───
    // Sauf si l'acheteur a explicitement choisi "retrait sur place" (deliveryOption contient "PICKUP")
    const hasDelivery = order.delivery !== null;
    const hasDeliveryRequest = await this.prisma.deliveryRequest.findUnique({ where: { orderId: dto.orderId } });
    const isPickup = order.deliveryOption && order.deliveryOption.includes('PICKUP');

    if (!hasDelivery && !hasDeliveryRequest && !isPickup && !order.deliveryCostIncluded) {
      throw new BadRequestException(
        'Veuillez d\'abord choisir une option de livraison avant de payer. ' +
        'Les frais de livraison seront ajoutés au total de votre commande.'
      );
    }

    // Si une demande de livraison existe mais n'est pas encore acceptée, avertir
    if (hasDeliveryRequest && hasDeliveryRequest.status === 'OPEN' && !hasDelivery) {
      throw new BadRequestException(
        'Votre demande de livraison est en attente d\'un transporteur. ' +
        'Patientez qu\'un transporteur accepte avant de payer, ou annulez la demande pour retirer sur place.'
      );
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('Le numéro ou la référence est requis pour initier un paiement');
    }

    const transactionId = dto.provider === 'MANUAL'
      ? `BANK-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
      : uuidv4();

    // Initialiser le paiement via NotchPay (Mobile Money)
    let paymentUrl: string | null = null;
    let notchpayReference: string | null = null;

    if (dto.provider !== 'MANUAL') {
      const buyer = await this.prisma.user.findUnique({ where: { id: userId } });
      const backendUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : 'http://localhost:4000';
      const callbackUrl = `${backendUrl}/payments/callback`;

      const notchPayResult = await this.notchPay.initializePayment({
        amount: order.totalPrice,
        currency: 'XAF',
        customerName: buyer?.name || 'Client',
        customerEmail: buyer?.email || '',
        customerPhone: dto.phone,
        description: `Commande #${dto.orderId.slice(0, 8)} sur AgriB2B`,
        reference: transactionId,
        callbackUrl,
      });

      paymentUrl = notchPayResult.authorization_url;
      notchpayReference = notchPayResult.notchpayReference;

      // Si on a une référence NotchPay et pas d'URL de paiement (API directe),
      // lancer un Direct Charge pour envoyer le prompt USSD au client
      if (notchpayReference && !notchPayResult.simulated) {
        const channel = this.notchPay.getChannelForProvider(dto.provider);
        try {
          await this.notchPay.directCharge(notchpayReference, {
            channel,
            phone: dto.phone,
          });
          this.logger.log(`Direct charge sent to ${dto.phone} via ${channel}`);
        } catch (err: any) {
          this.logger.warn(`Direct charge failed (will fallback to checkout URL): ${err.message}`);
          // Si le direct charge échoue, on continue avec l'URL de checkout
        }
      }
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: dto.orderId },
      update: {
        provider: dto.provider as any,
        phone: dto.phone,
        amount: order.totalPrice,
        transactionId: notchpayReference || transactionId,
        status: 'PENDING',
      },
      create: {
        orderId: dto.orderId,
        provider: dto.provider as any,
        phone: dto.phone,
        amount: order.totalPrice,
        transactionId: notchpayReference || transactionId,
        status: 'PENDING',
      },
    });

    // Notifier acheteur et vendeur (in-app + push)
    const buyerTitle   = dto.provider === 'MANUAL' ? '🧾 Paiement en attente' : '⏳ Paiement en attente';
    const buyerMessage = dto.provider === 'MANUAL'
      ? `Votre virement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a été enregistré et est en attente de validation. Réf: ${transactionId}`
      : `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA via ${this.providerLabel(dto.provider)} est en cours. Validez sur votre téléphone.`;
    const sellerTitle   = '💰 Paiement en attente';
    const sellerMessage = `Le paiement de la commande #${dto.orderId.slice(0, 8)} (${order.totalPrice.toLocaleString('fr-FR')} FCFA) est en attente de validation.`;

    await this.prisma.notification.createMany({
      data: [
        { userId: order.buyerId,  title: buyerTitle,  message: buyerMessage  },
        { userId: order.sellerId, title: sellerTitle, message: sellerMessage },
      ],
    });
    this.pushService.sendToUser(order.buyerId,  { title: buyerTitle,  body: buyerMessage,  url: '/dashboard/payments' }).catch(() => {});
    this.pushService.sendToUser(order.sellerId, { title: sellerTitle, body: sellerMessage, url: '/dashboard/payments' }).catch(() => {});

    return {
      success: true,
      transactionId: notchpayReference || transactionId,
      provider: dto.provider,
      amount: order.totalPrice,
      paymentUrl,
      message: dto.provider === 'MANUAL'
        ? `Virement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA enregistré. Réf: ${transactionId}`
        : paymentUrl
          ? `Paiement initié. Complétez le paiement sur la page de paiement.`
          : `Paiement initié via ${this.providerLabel(dto.provider)}. Validez la transaction sur votre téléphone.`,
    };
  }

  // ─── Statut d'un paiement ──────────────────────────────────────────────────
  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) return { status: 'NOT_INITIATED', orderId };
    return payment;
  }

  // ─── Vérifier un paiement via NotchPay et mettre à jour en BDD ─────────────
  async verifyAndUpdatePayment(reference: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: reference },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Paiement introuvable');

    const order = payment.order;
    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    // Si déjà payé, retourner le statut
    if (payment.status === 'SUCCESS') {
      return { status: 'SUCCESS', message: 'Paiement déjà confirmé', payment };
    }

    // Vérifier côté NotchPay
    try {
      const verification = await this.notchPay.verifyPayment(reference);

      if (verification.status === 'complete') {
        await this.markPaymentSuccess(payment.id, payment.orderId);
        return { status: 'SUCCESS', message: 'Paiement confirmé' };
      } else if (verification.status === 'failed' || verification.status === 'expired') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
        return { status: 'FAILED', message: 'Le paiement a échoué ou expiré' };
      }

      return { status: 'PENDING', message: 'Paiement en cours de traitement', notchpayStatus: verification.status };
    } catch (err: any) {
      this.logger.error(`Verify payment error: ${err.message}`);
      return { status: 'PENDING', message: 'Impossible de vérifier le paiement pour le moment' };
    }
  }

  // ─── Confirmation manuelle (vendeur/admin) ─────────────────────────────────
  async confirmPayment(orderId: string, dto: { status: 'SUCCESS' | 'FAILED' }, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true, seller: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role !== 'ADMIN' && order.sellerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }
    if (!order.payment) throw new NotFoundException('Aucun paiement enregistré pour cette commande');
    if (order.payment.status === 'SUCCESS') {
      throw new ConflictException('Le paiement a déjà été confirmé');
    }

    if (dto.status === 'SUCCESS') {
      await this.markPaymentSuccess(order.payment.id, orderId);
    } else {
      await this.prisma.payment.update({
        where: { orderId },
        data: { status: 'FAILED' },
      });
    }

    await this.prisma.notification.createMany({
      data: [
        {
          userId: order.buyerId,
          title: dto.status === 'SUCCESS' ? '✅ Paiement validé' : '❌ Paiement refusé',
          message: dto.status === 'SUCCESS'
            ? `Le paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA pour la commande #${orderId.slice(0, 8)} a été validé.`
            : `Le paiement de la commande #${orderId.slice(0, 8)} a été refusé. Veuillez réessayer.`,
        },
        {
          userId: order.sellerId,
          title: dto.status === 'SUCCESS' ? '✅ Paiement confirmé' : '❌ Paiement rejeté',
          message: dto.status === 'SUCCESS'
            ? `Le paiement de la commande #${orderId.slice(0, 8)} a été confirmé.`
            : `Le paiement de la commande #${orderId.slice(0, 8)} a été rejeté.`,
        },
      ],
    });
    // Push confirm/reject
    const bTitle = dto.status === 'SUCCESS' ? '✅ Paiement validé' : '❌ Paiement refusé';
    const bMsg   = dto.status === 'SUCCESS'
      ? `Le paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA pour la commande #${orderId.slice(0, 8)} a été validé.`
      : `Le paiement de la commande #${orderId.slice(0, 8)} a été refusé.`;
    const sTitle = dto.status === 'SUCCESS' ? '✅ Paiement confirmé' : '❌ Paiement rejeté';
    const sMsg   = dto.status === 'SUCCESS'
      ? `Le paiement de la commande #${orderId.slice(0, 8)} a été confirmé.`
      : `Le paiement de la commande #${orderId.slice(0, 8)} a été rejeté.`;
    this.pushService.sendToUser(order.buyerId,  { title: bTitle, body: bMsg, url: '/dashboard/payments' }).catch(() => {});
    this.pushService.sendToUser(order.sellerId, { title: sTitle, body: sMsg, url: '/dashboard/payments' }).catch(() => {});

    const updated = await this.prisma.payment.findUnique({ where: { orderId } });
    return updated;
  }

  // ─── Webhook NotchPay ──────────────────────────────────────────────────────
  async handleWebhook(event: any, signature?: string, rawBody?: Buffer) {
    // Vérification de signature si disponible
    if (signature && rawBody) {
      const payload = rawBody.toString('utf-8');
      const isValid = this.notchPay.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        this.logger.warn('Invalid webhook signature — rejecting');
        return { received: false, reason: 'Invalid signature' };
      }
    }

    const { type, data } = event;
    this.logger.log(`Webhook received: ${type} — ref: ${data?.reference || 'unknown'}`);

    if (type === 'payment.complete') {
      const reference = data?.reference;
      if (!reference) return { received: true };

      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: reference },
      });

      if (payment && payment.status !== 'SUCCESS') {
        await this.markPaymentSuccess(payment.id, payment.orderId);
        this.logger.log(`Payment ${reference} marked as SUCCESS via webhook`);
      }
    }

    if (type === 'payment.failed') {
      const reference = data?.reference;
      if (!reference) return { received: true };

      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: reference },
      });

      if (payment && payment.status === 'PENDING') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        // Notifier l'acheteur
        const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
        if (order) {
          await this.prisma.notification.create({
            data: {
              userId: order.buyerId,
              title: '❌ Paiement échoué',
              message: `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a échoué. Veuillez réessayer.`,
            },
          });
          this.pushService.sendToUser(order.buyerId, {
            title: '❌ Paiement échoué',
            body:  `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a échoué. Veuillez réessayer.`,
            url:   '/dashboard/payments',
          }).catch(() => {});
        }
        this.logger.log(`Payment ${reference} marked as FAILED via webhook`);
      }
    }

    return { received: true };
  }

  // ─── Callback : Quand l'utilisateur revient de NotchPay ────────────────────
  async handleCallbackVerification(reference: string, trxref?: string) {
    const ref = reference || trxref;
    if (!ref) return;

    try {
      const verification = await this.notchPay.verifyPayment(ref);

      const payment = await this.prisma.payment.findFirst({
        where: {
          OR: [
            { transactionId: ref },
            { transactionId: trxref },
          ],
        },
      });

      if (!payment) {
        this.logger.warn(`Callback: no payment found for reference ${ref}`);
        return;
      }

      if (verification.status === 'complete' && payment.status !== 'SUCCESS') {
        await this.markPaymentSuccess(payment.id, payment.orderId);
        this.logger.log(`Payment ${ref} confirmed via callback verification`);
      } else if (verification.status === 'failed' && payment.status === 'PENDING') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    } catch (err: any) {
      this.logger.error(`Callback verification error: ${err.message}`);
    }
  }

  // ─── Vérifier le statut d'un paiement via NotchPay (utilitaire) ────────────
  async verifyPaymentWithNotchPay(reference: string) {
    return this.notchPay.verifyPayment(reference);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Marque un paiement comme SUCCESS, confirme la commande et crée l'escrow
   */
  private async markPaymentSuccess(paymentId: string, orderId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS' },
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { seller: true },
    });

    if (!order) return payment;

    // Confirmer la commande si encore en PENDING
    if (order.status === 'PENDING') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
      });
    }

    // Calculer et créer l'escrow avec commission
    const commissionDetails = this.commissionService.getCommissionDetails(
      order.totalPrice,
      order.seller.accountType as any,
      order.seller.role,
    );

    await this.prisma.escrow.upsert({
      where: { orderId },
      update: {
        amount: order.totalPrice,
        commission: commissionDetails.commission,
        sellerAmount: commissionDetails.sellerAmount,
      },
      create: {
        orderId,
        amount: order.totalPrice,
        commission: commissionDetails.commission,
        sellerAmount: commissionDetails.sellerAmount,
        status: 'HELD',
      },
    });

    // Notifications paiement succès (in-app + push)
    await this.prisma.notification.createMany({
      data: [
        {
          userId: order.buyerId,
          title: '✅ Paiement validé',
          message: `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a été confirmé avec succès.`,
        },
        {
          userId: order.sellerId,
          title: '✅ Paiement reçu',
          message: `Le paiement de la commande #${orderId.slice(0, 8)} (${order.totalPrice.toLocaleString('fr-FR')} FCFA) a été confirmé.`,
        },
      ],
    });
    this.pushService.sendToUser(order.buyerId, {
      title: '✅ Paiement validé',
      body:  `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a été confirmé avec succès.`,
      url:   '/dashboard/payments',
    }).catch(() => {});
    this.pushService.sendToUser(order.sellerId, {
      title: '✅ Paiement reçu',
      body:  `Le paiement de la commande #${orderId.slice(0, 8)} (${order.totalPrice.toLocaleString('fr-FR')} FCFA) a été confirmé.`,
      url:   '/dashboard/payments',
    }).catch(() => {});

    return payment;
  }

  private providerLabel(provider: string): string {
    const labels: Record<string, string> = {
      MTN_MOMO: 'MTN Mobile Money',
      ORANGE_MONEY: 'Orange Money',
      MANUAL: 'Virement bancaire',
    };
    return labels[provider] || provider;
  }
}
