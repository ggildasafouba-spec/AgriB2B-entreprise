import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('KYC')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Soumettre un document KYC' })
  submit(
    @Body('documentType') documentType: string,
    @Body('documentUrl') documentUrl: string,
    @Request() req,
  ) {
    return this.kycService.submit(req.user.id, documentType, documentUrl);
  }

  @Get('me')
  @ApiOperation({ summary: 'Mon statut KYC' })
  getMyKyc(@Request() req) {
    return this.kycService.getMyKyc(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tous les KYC (admin)' })
  findAll() {
    return this.kycService.findAll();
  }

  @Put(':id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Approuver/Rejeter un KYC (admin)' })
  review(@Param('id') id: string, @Body('status') status: 'VERIFIED' | 'REJECTED') {
    return this.kycService.review(id, status);
  }
}
