import { Controller, Get, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private prisma: PrismaService) {}

  @Post(':articleId/view')
  @ApiOperation({ summary: 'Incrémenter le compteur de vues d\'un article' })
  async incrementView(@Param('articleId') articleId: string) {
    const existing = await this.prisma.articleView.findUnique({ where: { articleId } });
    if (existing) {
      return this.prisma.articleView.update({
        where: { articleId },
        data: { views: { increment: 1 } },
      });
    }
    return this.prisma.articleView.create({
      data: { articleId, views: 1 },
    });
  }

  @Get('views')
  @ApiOperation({ summary: 'Récupérer tous les compteurs de vues' })
  async getAllViews() {
    return this.prisma.articleView.findMany();
  }

  @Get(':articleId/views')
  @ApiOperation({ summary: 'Récupérer le compteur de vues d\'un article' })
  async getViews(@Param('articleId') articleId: string) {
    const record = await this.prisma.articleView.findUnique({ where: { articleId } });
    return { articleId, views: record?.views || 0 };
  }
}
