import { Controller, Get, Param, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get(':orderId')
  @ApiOperation({ summary: 'Télécharger la facture PDF d\'une commande' })
  async getInvoice(
    @Param('orderId') orderId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    const buffer = await this.invoicesService.generateInvoice(orderId, req.user.id);
    const filename = `facture-AGM-${orderId.slice(0, 8).toUpperCase()}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
