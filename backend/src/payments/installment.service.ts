import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Service de paiement échelonné
 * 
 * Options disponibles :
 * - 2 tranches : 60% acompte + 40% à la livraison
 * - 3 tranches : 50% acompte + 25% à l'expédition + 25% à la livraison
 */
@Injectable()
export class InstallmentService {
  constructor(private prisma: PrismaService) {}

  async createPlan(orderId: string, userId: string, installments: number) {
    if (installments < 2 || installments > 3) {
      throw new BadRequestException('Le nombre de tranches doit être 2 ou 3');
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new BadRequestException('Seul l\'acheteur peut créer un plan de paiement');

    const existing = await this.prisma.installmentPlan.findUnique({ where: { orderId } });
    if (existing) throw new BadRequestException('Un plan de paiement existe déjà pour cette commande');

    const total = order.totalPrice;
    const now = new Date();
    let payments: { amount: number; dueDate: Date; label: string }[];

    if (installments === 2) {
      payments = [
        { amount: Math.round(total * 0.6 * 100) / 100, dueDate: now, label: 'Acompte (60%)' },
        { amount: Math.round(total * 0.4 * 100) / 100, dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), label: 'Solde à la livraison (40%)' },
      ];
    } else {
      payments = [
        { amount: Math.round(total * 0.5 * 100) / 100, dueDate: now, label: 'Acompte (50%)' },
        { amount: Math.round(total * 0.25 * 100) / 100, dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), label: 'À l\'expédition (25%)' },
        { amount: Math.round(total * 0.25 * 100) / 100, dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), label: 'Solde à la livraison (25%)' },
      ];
    }

    const plan = await this.prisma.installmentPlan.create({
      data: {
        orderId,
        totalAmount: total,
        installments,
        payments: { create: payments },
      },
      include: { payments: { orderBy: { dueDate: 'asc' } } },
    });

    await this.prisma.notification.create({
      data: {
        userId: order.sellerId,
        title: '💳 Paiement échelonné créé',
        message: `L'acheteur a choisi un paiement en ${installments} tranches pour la commande #${orderId.slice(0, 8)}.`,
      },
    });

    return plan;
  }

  async markPaid(paymentId: string, userId: string) {
    const payment = await this.prisma.installmentPayment.findUnique({
      where: { id: paymentId },
      include: { plan: true },
    });
    if (!payment) throw new NotFoundException('Paiement introuvable');

    const updated = await this.prisma.installmentPayment.update({
      where: { id: paymentId },
      data: { status: 'SUCCESS', paidAt: new Date() },
    });

    // Vérifier si toutes les tranches sont payées
    const allPayments = await this.prisma.installmentPayment.findMany({
      where: { planId: payment.planId },
    });
    const allPaid = allPayments.every(p => p.id === paymentId || p.status === 'SUCCESS');

    if (allPaid) {
      await this.prisma.installmentPlan.update({
        where: { id: payment.planId },
        data: { status: 'COMPLETED' },
      });
    }

    return updated;
  }

  async getPlan(orderId: string) {
    const plan = await this.prisma.installmentPlan.findUnique({
      where: { orderId },
      include: { payments: { orderBy: { dueDate: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Aucun plan de paiement pour cette commande');
    return plan;
  }
}
