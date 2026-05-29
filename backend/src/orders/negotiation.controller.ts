import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NegotiationService } from './negotiation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Negotiations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('negotiations')
export class NegotiationController {
  constructor(private negotiationService: NegotiationService) {}

  @Post()
  @ApiOperation({ summary: 'Proposer un prix (acheteur)' })
  create(@Body() body: { productId: string; proposedPrice: number; quantity: number; message?: string }, @Request() req: any) {
    return this.negotiationService.create(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Mes négociations' })
  getAll(@Request() req: any) {
    return this.negotiationService.getMyNegotiations(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une négociation' })
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.negotiationService.getOne(id, req.user.id);
  }

  @Put(':id/respond')
  @ApiOperation({ summary: 'Répondre à une négociation (accepter/refuser/contre-proposition)' })
  respond(@Param('id') id: string, @Body() body: { action: string; counterPrice?: number; message?: string }, @Request() req: any) {
    return this.negotiationService.respond(id, req.user.id, body);
  }
}
