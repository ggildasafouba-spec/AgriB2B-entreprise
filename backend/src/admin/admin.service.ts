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

    // Commissions par escrow libéré
    const releasedEscrows = await this.prisma.escrow.aggregate({
      _sum: { commission: true, sellerAmount: true, amount: true },
      where: { status: 'RELEASED' },
    });

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
        totalCommission: releasedEscrows._sum.commission || totalCommission,
        totalSellerPayouts: releasedEscrows._sum.sellerAmount || totalSellers,
        commissionRate: (releasedEscrows._sum.amount && releasedEscrows._sum.amount > 0)
          ? Math.round((releasedEscrows._sum.commission / releasedEscrows._sum.amount) * 10000) / 100
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
