import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

const COMPANY_COMMISSION = 0.10; // 10%
const INDIVIDUAL_COMMISSION = 0.05; // 5%

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto, buyerId: string) {
    let totalPrice = 0;
    const enrichedItems: any[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { stock: true },
      });
      if (!product) throw new NotFoundException(`Produit ${item.productId} introuvable`);
      if (!product.stock || product.stock.quantity < item.quantity) {
        throw new BadRequestException(`Stock insuffisant pour ${product.name}`);
      }
      totalPrice += product.price * item.quantity;
      enrichedItems.push({ product, quantity: item.quantity, unitPrice: product.price });
    }

    const sellerId = enrichedItems[0].product.sellerId;

    // Détermine le taux de commission selon le type de compte du vendeur
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    const rate = seller?.accountType === 'COMPANY' ? COMPANY_COMMISSION : INDIVIDUAL_COMMISSION;

    const commission   = Math.round(totalPrice * rate * 100) / 100;
    const sellerAmount = Math.round((totalPrice - commission) * 100) / 100;

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        sellerId,
        totalPrice,
        items: {
          create: enrichedItems.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
        escrow: {
          create: {
            amount: totalPrice,
            commission,
            sellerAmount,
          },
        },
      },
      include: { items: true, escrow: true },
    });

    // Déduire le stock
    for (const item of enrichedItems) {
      await this.prisma.stock.update({
        where: { productId: item.product.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Notifier le vendeur avec détail commission
    await this.prisma.notification.create({
      data: {
        userId: sellerId,
        title: 'Nouvelle commande reçue',
        message:
          `Commande de ${totalPrice.toLocaleString('fr-FR')} FCFA. ` +
          `Commission plateforme (${Math.round(rate * 100)}%) : ${commission.toLocaleString('fr-FR')} FCFA. ` +
          `Vous recevrez : ${sellerAmount.toLocaleString('fr-FR')} FCFA après livraison.`,
      },
    });

    return order;
  }

  async findAll(userId: string, role: string) {
    const where =
      role === 'ADMIN' ? {} :
      role === 'SELLER' ? { sellerId: userId } :
      { buyerId: userId };

    return this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, unit: true } } } },
        buyer:  { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        escrow: true,
        payment: true,
        delivery: { include: { trackingEvents: { orderBy: { createdAt: 'desc' }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items:  { include: { product: true } },
        buyer:  { select: { name: true, email: true } },
        seller: { select: { name: true, email: true } },
        escrow: true,
        payment: true,
      },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (role !== 'ADMIN' && order.buyerId !== userId && order.sellerId !== userId) {
      throw new NotFoundException('Commande introuvable');
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { escrow: true, seller: { select: { accountType: true } } } });
    if (!order) throw new NotFoundException('Commande introuvable');

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status as any },
    });

    if (dto.status === 'DELIVERED' && order.escrow) {
      await this.prisma.escrow.update({
        where: { orderId: id },
        data: { status: 'RELEASED' },
      });

      const commission   = order.escrow.commission;
      const sellerAmount = order.escrow.sellerAmount;
      const rate = order.seller?.accountType === 'COMPANY' ? COMPANY_COMMISSION : INDIVIDUAL_COMMISSION;

      await this.prisma.notification.create({
        data: {
          userId: order.sellerId,
          title: 'Paiement libéré ✅',
            message:
            `Commande #${id.slice(0, 8)} livrée. ` +
            `Montant total : ${order.totalPrice.toLocaleString('fr-FR')} FCFA. ` +
            `Commission plateforme (${Math.round(rate * 100)}%) : ${commission.toLocaleString('fr-FR')} FCFA. ` +
            `Montant versé : ${sellerAmount.toLocaleString('fr-FR')} FCFA.`,
        },
      });
    }

    if (dto.status === 'CANCELLED' && order.escrow) {
      // Annuler l'escrow — la commission n'est PAS prélevée
      await this.prisma.escrow.update({
        where: { orderId: id },
        data: {
          status: 'REFUNDED',
          commission: 0,
          sellerAmount: 0,
        },
      });

      // Marquer le paiement comme remboursé si existant
      const payment = await this.prisma.payment.findUnique({ where: { orderId: id } });
      if (payment && payment.status === 'SUCCESS') {
        await this.prisma.payment.update({
          where: { orderId: id },
          data: { status: 'REFUNDED' },
        });
      }

      // Restituer le stock
      const orderItems = await this.prisma.orderItem.findMany({ where: { orderId: id } });
      for (const item of orderItems) {
        await this.prisma.stock.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        }).catch(() => {}); // Ignorer si le stock n'existe plus
      }

      // Notifier l'acheteur
      await this.prisma.notification.create({
        data: {
          userId: order.buyerId,
          title: '🚫 Commande annulée — Remboursement',
          message: `Votre commande #${id.slice(0, 8)} a été annulée. Le montant de ${order.totalPrice.toLocaleString('fr-FR')} FCFA sera remboursé. Aucune commission n'a été prélevée.`,
        },
      });

      // Notifier le vendeur
      await this.prisma.notification.create({
        data: {
          userId: order.sellerId,
          title: '🚫 Commande annulée',
          message: `La commande #${id.slice(0, 8)} (${order.totalPrice.toLocaleString('fr-FR')} FCFA) a été annulée. Aucune commission n'a été prélevée et le stock a été restitué.`,
        },
      });
    }

    return updated;
  }
}
