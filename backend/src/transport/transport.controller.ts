import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { TransportService } from './transport.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Transport')
@Controller('transport')
export class TransportController {
  constructor(private transportService: TransportService) {}

  @Get('rates')
  @ApiOperation({ summary: 'Consulter toutes les grilles tarifaires (public)' })
  getAllRates(
    @Query('origin') origin?: string,
    @Query('destination') destination?: string,
    @Query('productCategory') productCategory?: string,
  ) {
    return this.transportService.getAllRates({ origin, destination, productCategory });
  }

  @Get('rates/:id')
  @ApiOperation({ summary: 'Détail d\'un tarif' })
  getRateById(@Param('id') id: string) {
    return this.transportService.getRateById(id);
  }

  @Get('my-rates')
  @UseGuards(JwtAuthGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes tarifs (transporteur connecté)' })
  getMyRates(@Request() req: any) {
    return this.transportService.getMyRates(req.user.id);
  }

  @Post('rates')
  @UseGuards(JwtAuthGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un tarif de transport' })
  createRate(@Request() req: any, @Body() body: {
    origin: string;
    destination: string;
    productCategory: string;
    pricePerKg: number;
    pricePerUnit?: number;
    minWeight?: number;
    maxWeight?: number;
    vehicleType?: string;
    estimatedDays?: number;
  }) {
    return this.transportService.createRate(req.user.id, body);
  }

  @Put('rates/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un tarif' })
  updateRate(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.transportService.updateRate(id, req.user.id, body);
  }

  @Delete('rates/:id')
  @UseGuards(JwtAuthGuard)
  @Roles('TRANSPORTER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un tarif' })
  deleteRate(@Request() req: any, @Param('id') id: string) {
    return this.transportService.deleteRate(id, req.user.id);
  }
}
