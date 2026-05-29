import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InstallmentService } from './installment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Installments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('installments')
export class InstallmentController {
  constructor(private installmentService: InstallmentService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un plan de paiement échelonné (2 ou 3 tranches)' })
  create(@Body() body: { orderId: string; installments: number }, @Request() req: any) {
    return this.installmentService.createPlan(body.orderId, req.user.id, body.installments);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Voir le plan de paiement d\'une commande' })
  getPlan(@Param('orderId') orderId: string) {
    return this.installmentService.getPlan(orderId);
  }

  @Put(':paymentId/pay')
  @ApiOperation({ summary: 'Marquer une tranche comme payée' })
  markPaid(@Param('paymentId') paymentId: string, @Request() req: any) {
    return this.installmentService.markPaid(paymentId, req.user.id);
  }
}
