import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';
import { DeliveryRequestService } from './delivery-request.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(
    private deliveryService: DeliveryService,
    private deliveryRequestService: DeliveryRequestService,
  ) {}

  @Get('service-options')
  @ApiOperation({ summary: 'Options de qualité de service disponibles' })
  getServiceOptions() {
    return this.deliveryService.getServiceOptions();
  }

  @Post('calculate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculer le coût de livraison' })
  calculateCost(@Body() body: {
    transportRateId: string;
    weight: number;
    serviceType: string;
  }) {
    return this.deliveryService.calculateDeliveryCost(body);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une livraison pour une commande' })
  createDelivery(@Body() body: {
    orderId: string;
    transportRateId: string;
    weight: number;
    serviceType: string;
    deliveryAddress: string;
    recipientName: string;
    recipientPhone: string;
  }) {
    return this.deliveryService.createDelivery(body.orderId, body);
  }

  @Post('create-simple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une livraison simple (sans transporteur externe)' })
  createSimpleDelivery(@Body() body: {
    orderId: string;
    deliveryAddress: string;
    recipientPhone: string;
    deliveryCost: number;
    label: string;
  }) {
    return this.deliveryService.createSimpleDelivery(body);
  }

  @Get('tracking/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suivi de livraison d\'une commande' })
  getTracking(@Param('orderId') orderId: string, @Request() req: any) {
    return this.deliveryService.getTracking(orderId, req.user.id, req.user.role);
  }

  @Put(':deliveryId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TRANSPORTER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour le statut de livraison (transporteur)' })
  updateStatus(
    @Param('deliveryId') deliveryId: string,
    @Body() body: { status: string; location?: string; description?: string; photoUrl?: string },
    @Request() req: any,
  ) {
    return this.deliveryService.updateStatus(deliveryId, req.user.id, body);
  }

  @Get('my-deliveries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes livraisons (transporteur)' })
  getMyDeliveries(@Request() req: any) {
    return this.deliveryService.getTransporterDeliveries(req.user.id);
  }

  // ═══ Demandes de livraison urbaine ═══════════════════════════════════════════

  @Post('request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une demande de livraison (acheteur)' })
  createRequest(@Request() req: any, @Body() body: {
    orderId: string;
    pickupAddress: string;
    deliveryAddress: string;
    distanceKm?: number;
    proposedPrice?: number;
    description?: string;
  }) {
    return this.deliveryRequestService.createRequest(req.user.id, body);
  }

  @Get('requests/open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TRANSPORTER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Demandes de livraison disponibles (transporteurs)' })
  getOpenRequests() {
    return this.deliveryRequestService.getOpenRequests();
  }

  @Get('requests/mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes demandes de livraison (acheteur)' })
  getMyRequests(@Request() req: any) {
    return this.deliveryRequestService.getMyRequests(req.user.id);
  }

  @Put('request/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une demande de livraison (transporteur)' })
  acceptRequest(@Param('id') id: string, @Request() req: any, @Body('acceptedPrice') acceptedPrice?: number) {
    return this.deliveryRequestService.acceptRequest(id, req.user.id, acceptedPrice);
  }

  @Put('request/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Annuler une demande de livraison (acheteur)' })
  cancelRequest(@Param('id') id: string, @Request() req: any) {
    return this.deliveryRequestService.cancelRequest(id, req.user.id);
  }
}
