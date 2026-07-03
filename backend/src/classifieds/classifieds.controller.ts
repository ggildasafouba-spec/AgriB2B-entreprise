import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Annonces & Emplois — CRUD simple stocké dans la table Notification (JSON)
 * Préfixe [CLASSIFIED] pour identifier les annonces.
 */
@ApiTags('Classifieds')
@Controller('classifieds')
export class ClassifiedsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister toutes les annonces et emplois' })
  async findAll() {
    const records = await this.prisma.notification.findMany({
      where: { title: { startsWith: '[CLASSIFIED]' } },
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
  @ApiOperation({ summary: 'Publier une annonce / offre d\'emploi' })
  async create(@Request() req: any, @Body() body: {
    title: string;
    description: string;
    type: string;
    category: string;
    location?: string;
    salary?: string;
    contactPhone?: string;
    contactEmail?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const data = {
      ...body,
      userId: req.user.id,
      userName: user?.name || 'Utilisateur',
    };

    const record = await this.prisma.notification.create({
      data: {
        userId: req.user.id,
        title: '[CLASSIFIED]',
        message: JSON.stringify(data),
      },
    });

    return { id: record.id, ...data, createdAt: record.createdAt };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une annonce' })
  async remove(@Param('id') id: string, @Request() req: any) {
    const record = await this.prisma.notification.findUnique({ where: { id } });
    if (!record || !record.title.startsWith('[CLASSIFIED]')) {
      return { message: 'Annonce introuvable' };
    }
    const data = JSON.parse(record.message);
    if (data.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return { message: 'Non autorisé' };
    }
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Supprimé' };
  }
}
