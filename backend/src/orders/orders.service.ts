import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { NotchPayService } from '../payments/notchpay.service';

const COMPANY_COMMISSION = 0.10; // 10%
const INDIVIDUAL_COMMISSION = 0.05; // 5%

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notchPay: NotchPayService,
  ) {}

  async create(dto: CreateOrderDto, buyerId: string) {
    // 1. Enrichir les items avec les données produit
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
      enrichedItems.push({ product, quantity: item.quantity, unitPrice: product.price });
    }

    // 2. Grouper par vendeur
    const sellerGroups: Record<string, any[]> = {};
    for (const item of enrichedItems) {
      const sid = item.product.sellerId;
      if (!sellerGroups[sid]) sellerGroups[sid] = [];
      sellerGroups[sid].push(item);
    }

    // 3. Créer une commande par vendeur
    const orders: any[] = [];
    const sellerIds = Object.keys(sellerGroups);

    for (const sellerId of sellerIds) {
      const items = sellerGroups[sellerId];
      let totalPrice = items.reduce((sum: number, i: any) => sum + i.unitPrice * i.quantity, 0);

      // Livraison : uniquement sur la première commande (ou répartir)
      let deliveryCost = 0;
      if (dto.deliveryOption && sellerIds.indexOf(sellerId) === 0) {
        try {
          const option = JSON.parse(dto.deliveryOption);
          deliveryCost = option.price || 0;
          totalPrice += deliveryCost;
        } catch {}
      }

      // Commission
      const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
      const rate = seller?.accountType === 'COMPANY' ? COMPANY_COMMISSION : INDIVIDUAL_COMMISSION;
      const productTotal = totalPrice - deliveryCost;
      const commission = Math.round(productTotal * rate * 100) / 100;
      const sellerAmount = Math.round((productTotal - commission) * 100) / 100;

      const order = await this.prisma.order.create({
        data: {
          buyerId,
          sellerId,
          totalPrice,
          deliveryOption: sellerIds.indexOf(sellerId) === 0 ? (dto.deliveryOption || null) : null,
          deliveryCostIncluded: deliveryCost,
          items: {
            create: items.map((i: any) => ({
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
      for (const item of items) {
        await this.prisma.stock.update({
          where: { productId: item.product.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Notifier le vendeur
      await this.prisma.notification.create({
        data: {
          userId: sellerId,
          title: 'Nouvelle commande reçue',
          message:
            `Commande de ${productTotal.toLocaleString('fr-FR')} FCFA. ` +
            `Commission plateforme (${Math.round(rate * 100)}%) : ${commission.toLocaleString('fr-FR')} FCFA. ` +
            `Vous recevrez : ${sellerAmount.toLocaleString('fr-FR')} FCFA après livraison.`,
        },
      });

      orders.push(order);
    }

    // Si une seule commande, retourner directement
    if (orders.length === 1) return orders[0];

    // Si plusieurs commandes, retourner un résumé
    return {
      message: `${orders.length} commandes créées (une par vendeur)`,
      orders,
    };
  }

  async findAll(userId: string, role: string) {
    const where: any =
      role === 'ADMIN' ? { status: { not: 'CANCELLED' } } :
      role === 'SELLER' ? { sellerId: userId, status: { not: 'CANCELLED' } } :
      { buyerId: userId, status: { not: 'CANCELLED' } };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, unit: true } } } },
        buyer:  { select: { id: true, name: true, email: true, phone: true, region: true } },
        seller: { select: { id: true, name: true, email: true, phone: true, region: true } },
        escrow: true,
        payment: true,
        delivery: { include: { trackingEvents: { orderBy: { createdAt: 'desc' }, take: 1 } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Masquer les coordonnées tant que la commande n'est pas payée + confirmée
    return orders.map(order => {
      const isPaidAndConfirmed = order.payment?.status === 'SUCCESS' && order.status !== 'PENDING';
      const isAdmin = role === 'ADMIN';

      if (!isPaidAndConfirmed && !isAdmin) {
        // Masquer les détails de l'autre partie
        if (order.buyerId === userId) {
          // L'acheteur ne voit que le nom et la région du vendeur
          return {
            ...order,
            seller: { id: order.seller.id, name: order.seller.name, region: order.seller.region, email: null, phone: null },
          };
        } else if (order.sellerId === userId) {
          // Le vendeur ne voit que la région de l'acheteur
          return {
            ...order,
            buyer: { id: order.buyer.id, name: null, region: order.buyer.region, email: null, phone: null },
          };
        }
      }

      return order;
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

  async updateOrder(id: string, dto: { items?: { productId: string; quantity: number }[]; deliveryAddress?: string; recipientPhone?: string }, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, escrow: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');
    if (order.buyerId !== userId) throw new BadRequestException('Non autorisé');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('La commande ne peut être modifiée que si elle est encore en attente (PENDING)');
    }

    // Si modification des items
    if (dto.items && dto.items.length > 0) {
      // Restituer l'ancien stock
      for (const item of order.items) {
        await this.prisma.stock.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        }).catch(() => {});
      }

      // Supprimer les anciens items
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

      // Calculer le nouveau total et créer les nouveaux items
      let totalPrice = 0;
      const newItems: any[] = [];

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
        newItems.push({ productId: item.productId, quantity: item.quantity, unitPrice: product.price });
      }

      // Créer les nouveaux items
      await this.prisma.orderItem.createMany({
        data: newItems.map(i => ({ orderId: id, ...i })),
      });

      // Déduire le nouveau stock
      for (const item of newItems) {
        await this.prisma.stock.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      // Mettre à jour le total
      await this.prisma.order.update({
        where: { id },
        data: { totalPrice },
      });

      // Recalculer l'escrow
      const seller = await this.prisma.user.findUnique({ where: { id: order.sellerId } });
      const rate = seller?.accountType === 'COMPANY' ? COMPANY_COMMISSION : INDIVIDUAL_COMMISSION;
      const commission = Math.round(totalPrice * rate * 100) / 100;
      const sellerAmount = Math.round((totalPrice - commission) * 100) / 100;

      if (order.escrow) {
        await this.prisma.escrow.update({
          where: { orderId: id },
          data: { amount: totalPrice, commission, sellerAmount },
        });
      }

      // Notifier le vendeur
      await this.prisma.notification.create({
        data: {
          userId: order.sellerId,
          title: '✏️ Commande modifiée',
          message: `La commande #${id.slice(0, 8)} a été modifiée par l'acheteur. Nouveau montant : ${totalPrice.toLocaleString('fr-FR')} FCFA.`,
        },
      });
    }

    // Retourner la commande mise à jour
    return this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, escrow: true },
    });
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

      // ─── Payout automatique au vendeur ───────────────────────────────
      const seller = await this.prisma.user.findUnique({ where: { id: order.sellerId } });
      if (seller?.phone) {
        try {
          const channel = seller.phone.startsWith('+23767') || seller.phone.startsWith('+23768')
            ? 'cm.mtn'
            : seller.phone.startsWith('+23769')
              ? 'cm.orange'
              : 'cm.mtn';

          await this.notchPay.transfer({
            amount: sellerAmount,
            currency: 'XAF',
            recipientPhone: seller.phone,
            recipientName: seller.name,
            channel,
            description: `Paiement commande #${id.slice(0, 8)} - AgriB2B`,
            reference: `seller-payout-${id.slice(0, 12)}-${Date.now()}`,
          });
        } catch (err: any) {
          // Log l'erreur mais ne bloque pas — l'admin pourra refaire manuellement
          console.error(`Payout vendeur échoué pour commande ${id}: ${err.message}`);
        }
      }

      // ─── Payout automatique au transporteur (si livraison) ───────────
      const delivery = await this.prisma.delivery.findUnique({ where: { orderId: id } });
      if (delivery && delivery.transporterId && delivery.transporterAmount > 0) {
        const transporter = await this.prisma.user.findUnique({ where: { id: delivery.transporterId } });
        if (transporter?.phone) {
          try {
            const channel = transporter.phone.startsWith('+23767') || transporter.phone.startsWith('+23768')
              ? 'cm.mtn'
              : transporter.phone.startsWith('+23769')
                ? 'cm.orange'
                : 'cm.mtn';

            await this.notchPay.transfer({
              amount: delivery.transporterAmount,
              currency: 'XAF',
              recipientPhone: transporter.phone,
              recipientName: transporter.name,
              channel,
              description: `Livraison commande #${id.slice(0, 8)} - AgriB2B`,
              reference: `transport-payout-${id.slice(0, 12)}-${Date.now()}`,
            });

            await this.prisma.notification.create({
              data: {
                userId: delivery.transporterId,
                title: '💰 Paiement reçu',
                message: `Votre paiement de ${delivery.transporterAmount.toLocaleString('fr-FR')} FCFA pour la livraison de la commande #${id.slice(0, 8)} a été envoyé.`,
              },
            });
          } catch (err: any) {
            console.error(`Payout transporteur échoué pour commande ${id}: ${err.message}`);
          }
        }
      }

      await this.prisma.notification.create({
        data: {
          userId: order.sellerId,
          title: 'Paiement libéré ✅',
            message:
            `Commande #${id.slice(0, 8)} livrée. ` +
            `Montant total : ${order.totalPrice.toLocaleString('fr-FR')} FCFA. ` +
            `Commission plateforme (${Math.round(rate * 100)}%) : ${commission.toLocaleString('fr-FR')} FCFA. ` +
            `Montant envoyé sur votre Mobile Money : ${sellerAmount.toLocaleString('fr-FR')} FCFA.`,
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

  async deleteOrder(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Commande introuvable');

    // Seul l'acheteur, le vendeur, ou l'admin peut supprimer
    if (role !== 'ADMIN' && order.buyerId !== userId && order.sellerId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    // On ne peut supprimer que les commandes annulées
    if (order.status !== 'CANCELLED') {
      throw new BadRequestException('Seules les commandes annulées peuvent être supprimées');
    }

    // Supprimer dans l'ordre (toutes les contraintes FK possibles)
    try {
      // Livraisons
      const delivery = await this.prisma.delivery.findUnique({ where: { orderId: id } });
      if (delivery) {
        await this.prisma.deliveryTracking.deleteMany({ where: { deliveryId: delivery.id } });
        await this.prisma.delivery.delete({ where: { orderId: id } });
      }
      await this.prisma.escrow.deleteMany({ where: { orderId: id } });
      await this.prisma.payment.deleteMany({ where: { orderId: id } });
      await this.prisma.message.deleteMany({ where: { orderId: id } });
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      await this.prisma.order.delete({ where: { id } });
    } catch (err: any) {
      // Si encore des contraintes, forcer la suppression des items puis la commande
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } }).catch(() => {});
      await this.prisma.order.delete({ where: { id } }).catch(() => {});
    }

    return { message: 'Commande supprimée' };
  }
}
