import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionService } from '../common/commission.service';
import { NotchPayService } from './notchpay.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private notchPay: NotchPayService,
  ) {}

  // ─── Initier un paiement MTN, Orange ou virement bancaire ────────────────
  async initiate(dto: InitiatePaymentDto, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new BadRequestException('Non autorisé');
    if (order.payment && order.payment.status === 'SUCCESS') {
      throw new ConflictException('Cette commande est déjà payée');
    }

    if (!dto.phone?.trim()) {
      throw new BadRequestException('Le numéro ou la référence est requis pour initier un paiement');
    }

    const transactionId = dto.provider === 'MANUAL'
      ? `BANK-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`
      : uuidv4();

    // Initialiser le paiement via NotchPay (Mobile Money)
    let paymentUrl: string | null = null;
    if (dto.provider !== 'MANUAL') {
      const buyer = await this.prisma.user.findUnique({ where: { id: userId } });
      const callbackUrl = `${process.env.FRONTEND_URL || 'https://www.mboamarket.africa'}/dashboard/payments`;

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
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: dto.orderId },
      update: {
        provider: dto.provider as any,
        phone: dto.phone,
        amount: order.totalPrice,
        transactionId,
        status: 'PENDING',
      },
      create: {
        orderId: dto.orderId,
        provider: dto.provider as any,
        phone: dto.phone,
        amount: order.totalPrice,
        transactionId,
        status: 'PENDING',
      },
    });

    // Notifier acheteur et vendeur
    await this.prisma.notification.createMany({
      data: [
        {
          userId: order.buyerId,
          title: dto.provider === 'MANUAL' ? '🧾 Paiement en attente' : '⏳ Paiement en attente',
          message: dto.provider === 'MANUAL'
            ? `Votre virement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA a été enregistré et est en attente de validation. Réf: ${transactionId}`
            : `Votre paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA via ${this.providerLabel(dto.provider)} est en attente de confirmation. Réf: ${transactionId}`,
        },
        {
          userId: order.sellerId,
          title: '💰 Paiement en attente',
          message: `Le paiement de la commande #${dto.orderId.slice(0, 8)} (${order.totalPrice.toLocaleString('fr-FR')} FCFA) est en attente de validation. Réf: ${transactionId}`,
        },
      ],
    });

    return {
      success: true,
      transactionId,
      provider: dto.provider,
      amount: order.totalPrice,
      paymentUrl,
      message: dto.provider === 'MANUAL'
        ? `Virement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA enregistré. Réf: ${transactionId}`
        : `Paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA initié via ${this.providerLabel(dto.provider)}`,
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

    const updatedPayment = await this.prisma.payment.update({
      where: { orderId },
      data: { status: dto.status },
    });

    if (dto.status === 'SUCCESS' && order.status === 'PENDING') {
      await this.prisma.order.update({ where: { id: orderId }, data: { status: 'CONFIRMED' } });

      // Calculate and store commission in Escrow
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

    return updatedPayment;
  }

  // ─── Webhook NotchPay (appelé par NotchPay quand le paiement est complété) ──
  async handleWebhook(event: any) {
    const { type, data } = event;

    if (type === 'payment.complete') {
      const reference = data?.reference;
      if (!reference) return { received: true };

      // Trouver le paiement par transactionId
      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: reference },
        include: { order: { include: { seller: true } } },
      });

      if (payment && payment.status !== 'SUCCESS') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS' },
        });

        // Confirmer la commande
        if (payment.order.status === 'PENDING') {
          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          });

          // Créer/Mettre à jour l'escrow
          const commissionDetails = this.commissionService.getCommissionDetails(
            payment.order.totalPrice,
            payment.order.seller.accountType as any,
            payment.order.seller.role,
          );

          await this.prisma.escrow.upsert({
            where: { orderId: payment.orderId },
            update: {
              amount: payment.order.totalPrice,
              commission: commissionDetails.commission,
              sellerAmount: commissionDetails.sellerAmount,
            },
            create: {
              orderId: payment.orderId,
              amount: payment.order.totalPrice,
              commission: commissionDetails.commission,
              sellerAmount: commissionDetails.sellerAmount,
              status: 'HELD',
            },
          });

          // Notifications
          await this.prisma.notification.createMany({
            data: [
              {
                userId: payment.order.buyerId,
                title: '✅ Paiement validé',
                message: `Votre paiement de ${payment.order.totalPrice.toLocaleString('fr-FR')} FCFA a été confirmé.`,
              },
              {
                userId: payment.order.sellerId,
                title: '✅ Paiement reçu',
                message: `Le paiement de la commande #${payment.orderId.slice(0, 8)} a été confirmé.`,
              },
            ],
          });
        }
      }
    }

    return { received: true };
  }

  // ─── Vérifier le statut d'un paiement via NotchPay ─────────────────────────
  async verifyPaymentWithNotchPay(reference: string) {
    return this.notchPay.verifyPayment(reference);
  }

  private providerLabel(provider: string): string {
    const labels: any = {
      MTN_MOMO: 'MTN Mobile Money',
      ORANGE_MONEY: 'Orange Money',
      MANUAL: 'Virement bancaire',
    };
    return labels[provider] || provider;
  }
}
