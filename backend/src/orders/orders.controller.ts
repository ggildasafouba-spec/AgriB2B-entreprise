import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, UpdateOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une commande' })
  create(@Body() dto: CreateOrderDto, @Request() req) {
    return this.ordersService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Mes commandes' })
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une commande' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.ordersService.findOne(id, req.user.id, req.user.role);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier une commande (tant qu\'elle est en PENDING)' })
  updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto, @Request() req) {
    return this.ordersService.updateOrder(id, dto, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une commande' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto, @Request() req) {
    return this.ordersService.updateStatus(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une commande annulée' })
  deleteOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.deleteOrder(id, req.user.id, req.user.role);
  }

  @Put(':id/pickup')
  @ApiOperation({ summary: 'Marquer la commande comme retrait sur place (pas de livraison)' })
  markAsPickup(@Param('id') id: string, @Request() req) {
    return this.ordersService.markAsPickup(id, req.user.id);
  }
}
