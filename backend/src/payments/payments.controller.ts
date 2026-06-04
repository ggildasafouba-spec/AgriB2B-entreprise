import { Controller, Post, Get, Put, Body, Param, Query, Req, Res, UseGuards, Request, RawBodyRequest, Headers } from '@nestjs/common';
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

  @Get('verify/:reference')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Vérifier un paiement via NotchPay et mettre à jour le statut' })
  verifyPayment(@Param('reference') reference: string, @Request() req) {
    return this.paymentsService.verifyAndUpdatePayment(reference, req.user.id);
  }

  @Put(':orderId/confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Confirmer ou rejeter un paiement (vendeur/admin)' })
  confirm(@Param('orderId') orderId: string, @Body() dto: ConfirmPaymentDto, @Request() req) {
    return this.paymentsService.confirmPayment(orderId, dto, req.user.id, req.user.role);
  }

  @Post('webhook/notchpay')
  @ApiOperation({ summary: 'Webhook NotchPay — reçoit les notifications de paiement' })
  handleWebhook(
    @Body() event: any,
    @Headers('x-notch-signature') signature: string,
    @Req() req: any,
  ) {
    return this.paymentsService.handleWebhook(event, signature, req.rawBody);
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback NotchPay — redirige l\'utilisateur après paiement' })
  async handleCallback(
    @Query('reference') reference: string,
    @Query('trxref') trxref: string,
    @Query('status') status: string,
    @Res() res: any,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.mboamarket.africa';

    try {
      // Vérifier le paiement côté NotchPay
      await this.paymentsService.handleCallbackVerification(reference, trxref);
    } catch (err) {
      // En cas d'erreur, rediriger quand même vers le frontend
    }

    // Rediriger vers le frontend avec le statut
    const redirectUrl = `${frontendUrl}/dashboard/payments?ref=${reference || trxref || ''}&status=${status || 'unknown'}`;
    return res.redirect(redirectUrl);
  }
}
