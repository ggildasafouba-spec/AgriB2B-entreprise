import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const COMMISSION_RATE = 0.05; // Taux moyen de fallback (5% particuliers, 10% entreprises)
const TRANSPORT_COMMISSION_RATE = 0.03;

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [users, products, orders, pendingKyc, deliveredAgg, transportRatesCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.kyc.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'DELIVERED' },
      }),
      this.prisma.transportRate.count({ where: { isActive: true } }),
    ]);

    const totalRevenue    = deliveredAgg._sum.totalPrice || 0;
    const totalCommission = Math.round(totalRevenue * COMMISSION_RATE * 100) / 100;
    const totalSellers    = Math.round((totalRevenue - totalCommission) * 100) / 100;

    // Commissions par escrow (toutes les commandes, pas seulement les libérées)
    const allEscrows = await this.prisma.escrow.aggregate({
      _sum: { commission: true, sellerAmount: true, amount: true },
    });

    // Commissions par escrow libéré uniquement
    const releasedEscrows = await this.prisma.escrow.aggregate({
      _sum: { commission: true, sellerAmount: true, amount: true },
      where: { status: 'RELEASED' },
    });

    // Commission transport cumulée (3% sur tous les tarifs actifs)
    // On calcule la commission potentielle basée sur les tarifs existants
    const transportRates = await this.prisma.transportRate.findMany({
      where: { isActive: true },
      select: { pricePerKg: true, pricePerUnit: true },
    });
    const transportCommissionTotal = Math.round(
      transportRates.reduce((sum, rate) => {
        return sum + (rate.pricePerKg * TRANSPORT_COMMISSION_RATE);
      }, 0) * 100
    ) / 100;

    // Montant cumulé de TOUTES les commissions (commandes + transport)
    const totalOrderCommissions = allEscrows._sum.commission || 0;
    const totalAllCommissions = Math.round((totalOrderCommissions + transportCommissionTotal) * 100) / 100;

    const ordersByStatus = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalPrice: true },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer:  { select: { name: true } },
        seller: { select: { name: true, accountType: true } },
        escrow: true,
      },
    });

    return {
      stats: {
        users,
        products,
        orders,
        pendingKyc,
        totalRevenue,
        // Commissions commandes (toutes)
        totalOrderCommissions,
        // Commissions commandes libérées uniquement
        totalReleasedCommissions: releasedEscrows._sum.commission || 0,
        totalSellerPayouts: releasedEscrows._sum.sellerAmount || totalSellers,
        // Commission transport estimée
        totalTransportCommissions: transportCommissionTotal,
        // TOTAL CUMULÉ de toutes les commissions
        totalAllCommissions,
        commissionRate: (allEscrows._sum.amount && allEscrows._sum.amount > 0)
          ? Math.round((allEscrows._sum.commission / allEscrows._sum.amount) * 10000) / 100
          : COMMISSION_RATE * 100,
        transportRatesCount,
        transportCommissionRate: TRANSPORT_COMMISSION_RATE * 100,
      },
      ordersByStatus,
      recentOrders,
    };
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        accountType: true, kycStatus: true, country: true, region: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(userId: string, role: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, email: true, name: true, role: true },
    });
  }

  async deleteUser(userId: string) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Utilisateur introuvable');

    // Supprimer toutes les données liées
    await this.prisma.notification.deleteMany({ where: { userId } });
    await this.prisma.message.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
    await this.prisma.kyc.deleteMany({ where: { userId } });
    await this.prisma.transportRate.deleteMany({ where: { transporterId: userId } });
    await this.prisma.deliveryTracking.deleteMany({ where: { delivery: { transporterId: userId } } });
    await this.prisma.delivery.deleteMany({ where: { transporterId: userId } });

    // Supprimer l'utilisateur
    await this.prisma.user.delete({ where: { id: userId } });

    return { message: `Utilisateur ${user.name} (${user.email}) supprimé avec succès` };
  }

  async getCommissionReport() {
    const escrows = await this.prisma.escrow.findMany({
      include: {
        order: {
          include: {
            buyer:  { select: { name: true } },
            seller: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return escrows.map(e => ({
      orderId:      e.orderId.slice(0, 8),
      status:       e.status,
      total:        e.amount,
      commission:   e.commission,
      sellerAmount: e.sellerAmount,
      buyer:        e.order.buyer?.name,
      seller:       e.order.seller?.name,
      date:         e.createdAt,
    }));
  }
}
