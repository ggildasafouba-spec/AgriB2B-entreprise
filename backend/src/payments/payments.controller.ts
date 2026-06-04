import { Controller, Post, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto, ConfirmPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Initier un paiement MTN MoMo, Orange Money ou Virement bancaire' })
  initiate(@Body() dto: InitiatePaymentDto, @Request() req) {
    return this.paymentsService.initiate(dto, req.user.id);
  }

  @Get('status/:orderId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Statut du paiement d\'une commande' })
  getStatus(@Param('orderId') orderId: string, @Request() req) {
    return this.paymentsService.getPaymentStatus(orderId, req.user.id);
  }

  @Put(':orderId/confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirmer ou rejeter un paiement' })
  confirm(@Param('orderId') orderId: string, @Body() dto: ConfirmPaymentDto, @Request() req) {
    return this.paymentsService.confirmPayment(orderId, dto, req.user.id, req.user.role);
  }

  @Post('webhook/notchpay')
  @ApiOperation({ summary: 'Webhook NotchPay - reçoit les notifications de paiement' })
  handleWebhook(@Body() event: any) {
    return this.paymentsService.handleWebhook(event);
  }
}
