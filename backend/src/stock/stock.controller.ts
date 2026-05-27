import { Controller, Get, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get('low')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Produits en stock faible' })
  getLowStock(@Query('threshold') threshold?: string) {
    return this.stockService.getLowStock(threshold ? parseInt(threshold) : 10);
  }

  @Get(':productId')
  @ApiOperation({ summary: 'Stock d\'un produit' })
  getStock(@Param('productId') productId: string) {
    return this.stockService.getStock(productId);
  }

  @Put(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le stock' })
  updateStock(
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Request() req,
  ) {
    return this.stockService.updateStock(productId, quantity, req.user.id, req.user.role);
  }
}
