import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getStock(productId: string) {
    const stock = await this.prisma.stock.findUnique({
      where: { productId },
      include: { product: { select: { name: true, unit: true } } },
    });
    if (!stock) throw new NotFoundException('Stock introuvable');
    return stock;
  }

  async updateStock(productId: string, quantity: number, userId: string, userRole: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.sellerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Non autorisé');

    return this.prisma.stock.upsert({
      where: { productId },
      update: { quantity },
      create: { productId, quantity },
    });
  }

  async getLowStock(threshold = 10) {
    return this.prisma.stock.findMany({
      where: { quantity: { lte: threshold } },
      include: { product: { select: { name: true, category: true, seller: { select: { name: true } } } } },
    });
  }
}
