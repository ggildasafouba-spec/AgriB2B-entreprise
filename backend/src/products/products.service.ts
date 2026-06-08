import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(category?: string) {
    return this.prisma.product.findMany({
      where: category ? { category } : {},
      include: {
        stock: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            country: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        stock: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            accountType: true,
            country: true,
            region: true,
            phone: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async create(dto: CreateProductDto, sellerId: string) {
    // Récupère la quantité minimale du vendeur si non précisée
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    const minOrderQty = dto.minOrderQty ?? seller?.minOrderQty ?? 1;

    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        unit: dto.unit || 'kg',
        category: dto.category,
        productionZone: dto.productionZone,
        images: dto.images || [],
        transport: dto.transport || [],
        deliveryOptions: dto.deliveryOptions || [],
        minOrderQty,
        sellerId,
        stock: { create: { quantity: dto.initialStock } },
      },
      include: { stock: true },
    });
  }

  async update(id: string, dto: UpdateProductDto, userId: string, userRole?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.sellerId !== userId && userRole !== 'ADMIN') throw new ForbiddenException('Non autorisé');
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, userRole: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Produit introuvable');
    if (product.sellerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Non autorisé');
    }
    // Supprimer les références liées au produit
    await this.prisma.orderItem.deleteMany({ where: { productId: id } });
    await this.prisma.stock.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }
}
