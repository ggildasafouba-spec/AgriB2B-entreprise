import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Matériel Agricole — CRUD simple stocké dans une table Notification (JSON)
 * On utilise un préfixe [EQUIPMENT] pour identifier les annonces de matériel.
 */
@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister tout le matériel agricole' })
  async findAll() {
    const records = await this.prisma.notification.findMany({
      where: { title: { startsWith: '[EQUIPMENT]' } },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => {
      try {
        const data = JSON.parse(r.message);
        return { id: r.id, ...data, createdAt: r.createdAt };
      } catch { return null; }
    }).filter(Boolean);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publier du matériel agricole' })
  async create(@Request() req: any, @Body() body: {
    title: string;
    description: string;
    price?: number;
    condition: string;
    category: string;
    location: string;
    images?: string[];
    contactPhone?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const data = {
      ...body,
      price: body.price || 0,
      images: body.images || [],
      userId: req.user.id,
      userName: user?.name || 'Utilisateur',
    };

    const record = await this.prisma.notification.create({
      data: {
        userId: req.user.id,
        title: '[EQUIPMENT]',
        message: JSON.stringify(data),
      },
    });

    return { id: record.id, ...data, createdAt: record.createdAt };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une annonce matériel' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    if (!record || !record.title.startsWith('[EQUIPMENT]')) {
      return { message: 'Annonce introuvable' };
    }
    // Vérifier propriétaire ou admin
    const data = JSON.parse(record.message);
    if (data.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return { message: 'Non autorisé' };
    }
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Supprimé' };
  }
}
