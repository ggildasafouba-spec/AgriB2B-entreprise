import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from './journal.service';
import { CommodityPricesService } from './commodity-prices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Journal')
@Controller('journal')
export class JournalController {
  constructor(
    private journalService: JournalService,
    private commodityPrices: CommodityPricesService,
  ) {}

  // ─── Prix des matières premières (public) ──────────────────────────────────
  @Get('prices')
  @ApiOperation({ summary: 'Prix actuels des matières premières agricoles' })
  getPrices() {
    return {
      prices: this.commodityPrices.getPrices(),
      lastUpdate: this.commodityPrices.getLastFetchTime(),
    };
  }

  @Post('prices/refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Forcer le rafraîchissement des prix (admin)' })
  async refreshPrices() {
    const prices = await this.commodityPrices.refreshPrices();
    return { prices, message: 'Prix rafraîchis' };
  }

  // ─── Articles (public en lecture, admin pour écriture) ─────────────────────
  @Get('articles')
  @ApiOperation({ summary: 'Liste des articles du journal agricole' })
  getArticles() {
    return this.journalService.getArticles();
  }

  @Post('articles')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Publier un article (admin)' })
  createArticle(
    @Request() req,
    @Body() data: {
      title: string;
      summary: string;
      content?: string;
      category: string;
      source?: string;
      sourceUrl?: string;
      imageUrl?: string;
    },
  ) {
    return this.journalService.createArticle(data, req.user.id);
  }

  @Delete('articles/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un article (admin)' })
  deleteArticle(@Param('id') id: string) {
    return this.journalService.deleteArticle(id);
  }
}
