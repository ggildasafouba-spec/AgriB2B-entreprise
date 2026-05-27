import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

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
      : await this.simulateMobileMoneyRequest(
          dto.provider,
          dto.phone,
          order.totalPrice,
        );

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
      message: dto.provider === 'MANUAL'
        ? `Virement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA enregistré. Réf: ${transactionId}`
        : `Paiement de ${order.totalPrice.toLocaleString('fr-FR')} FCFA confirmé via ${this.providerLabel(dto.provider)}`,
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
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
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

  // ─── Simulation Mobile Money (remplacer par vraie API en prod) ─────────────
  private async simulateMobileMoneyRequest(
    provider: string,
    phone: string,
    amount: number,
  ): Promise<string> {
    // Simule un délai réseau
    await new Promise(r => setTimeout(r, 500));

    const prefix = provider === 'MTN_MOMO' ? 'MTN' : provider === 'ORANGE_MONEY' ? 'OM' : 'MAN';
    const txId = `${prefix}-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

    console.log(`\n📱 ===== MOBILE MONEY SIMULATION =====`);
    console.log(`   Provider    : ${provider}`);
    console.log(`   Téléphone   : ${phone}`);
    console.log(`   Montant     : ${amount.toLocaleString('fr-FR')} FCFA`);
    console.log(`   Transaction : ${txId}`);
    console.log(`   Statut      : SUCCESS (simulé)`);
    console.log(`=====================================\n`);

    return txId;
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
