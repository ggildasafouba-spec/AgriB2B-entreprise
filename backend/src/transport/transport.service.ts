import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Commission plateforme sur les transactions transport : 3%
const TRANSPORT_COMMISSION_RATE = 0.03;

@Injectable()
export class TransportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Applique la commission de 3% sur un prix de base.
   * Le prix affiché aux utilisateurs inclut déjà la commission.
   */
  private applyCommission(basePrice: number): number {
    return Math.round(basePrice * (1 + TRANSPORT_COMMISSION_RATE) * 100) / 100;
  }

  /**
   * Enrichit un tarif avec les prix TTC (commission incluse)
   */
  private enrichRateWithCommission(rate: any) {
    return {
      ...rate,
      // Prix de base du transporteur (ce qu'il reçoit)
      basePricePerKg: rate.pricePerKg,
      basePricePerUnit: rate.pricePerUnit,
      // Prix affiché aux utilisateurs (commission 3% incluse)
      pricePerKg: this.applyCommission(rate.pricePerKg),
      pricePerUnit: rate.pricePerUnit ? this.applyCommission(rate.pricePerUnit) : null,
      // Détail commission
      commissionRate: TRANSPORT_COMMISSION_RATE,
      commissionPercent: Math.round(TRANSPORT_COMMISSION_RATE * 100),
    };
  }

  async createRate(transporterId: string, data: {
    origin: string;
    destination: string;
    productCategory: string;
    pricePerKg: number;
    pricePerUnit?: number;
    minWeight?: number;
    maxWeight?: number;
    vehicleType?: string;
    estimatedDays?: number;
  }) {
    const rate = await this.prisma.transportRate.create({
      data: { ...data, transporterId },
    });
    return rate;
  }

  async updateRate(id: string, transporterId: string, data: Partial<{
    origin: string;
    destination: string;
    productCategory: string;
    pricePerKg: number;
    pricePerUnit: number;
    minWeight: number;
    maxWeight: number;
    vehicleType: string;
    estimatedDays: number;
    isActive: boolean;
  }>) {
    const rate = await this.prisma.transportRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Tarif introuvable');
    if (rate.transporterId !== transporterId) throw new ForbiddenException('Accès refusé');
    return this.prisma.transportRate.update({ where: { id }, data });
  }

  async deleteRate(id: string, transporterId: string) {
    const rate = await this.prisma.transportRate.findUnique({ where: { id } });
    if (!rate) throw new NotFoundException('Tarif introuvable');
    if (rate.transporterId !== transporterId) throw new ForbiddenException('Accès refusé');
    return this.prisma.transportRate.delete({ where: { id } });
  }

  async getMyRates(transporterId: string) {
    const rates = await this.prisma.transportRate.findMany({
      where: { transporterId },
      orderBy: { createdAt: 'desc' },
    });
    // Pour le transporteur, on montre les deux : prix de base + prix affiché
    return rates.map(rate => this.enrichRateWithCommission(rate));
  }

  async getAllRates(filters?: { origin?: string; destination?: string; productCategory?: string }) {
    const where: any = { isActive: true };
    if (filters?.origin) where.origin = { contains: filters.origin, mode: 'insensitive' };
    if (filters?.destination) where.destination = { contains: filters.destination, mode: 'insensitive' };
    if (filters?.productCategory) where.productCategory = { contains: filters.productCategory, mode: 'insensitive' };

    const rates = await this.prisma.transportRate.findMany({
      where,
      include: { transporter: { select: { id: true, name: true, phone: true, region: true, country: true } } },
      orderBy: { pricePerKg: 'asc' },
    });

    // Retourne les prix avec commission incluse pour tous les utilisateurs
    return rates.map(rate => this.enrichRateWithCommission(rate));
  }

  async getRateById(id: string) {
    const rate = await this.prisma.transportRate.findUnique({
      where: { id },
      include: { transporter: { select: { id: true, name: true, phone: true, region: true, country: true } } },
    });
    if (!rate) throw new NotFoundException('Tarif introuvable');
    return this.enrichRateWithCommission(rate);
  }
}
