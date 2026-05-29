import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { getSeasonalProducts, CAMEROON_SEASONS, MONTH_NAMES_FR } from './seasons';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('seasons')
  @ApiOperation({ summary: 'Calendrier des saisons agricoles du Cameroun' })
  getSeasons(@Query('month') month?: string, @Query('region') region?: string) {
    const m = month ? parseInt(month) : undefined;
    return {
      currentMonth: MONTH_NAMES_FR[(m || new Date().getMonth() + 1) - 1],
      inSeason: getSeasonalProducts(m, region),
      allSeasons: CAMEROON_SEASONS,
      months: MONTH_NAMES_FR,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Liste tous les produits' })
  @ApiQuery({ name: 'category', required: false })
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un produit' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un produit (vendeur)' })
  create(@Body() dto: CreateProductDto, @Request() req) {
    return this.productsService.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un produit' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @Request() req) {
    return this.productsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un produit' })
  remove(@Param('id') id: string, @Request() req) {
    return this.productsService.remove(id, req.user.id, req.user.role);
  }
}
