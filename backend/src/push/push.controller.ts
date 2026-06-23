import { Controller, Post, Delete, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('push')
export class PushController {
  constructor(private pushService: PushService) {}

  @Get('vapid-public-key')
  @ApiOperation({ summary: 'Clé publique VAPID pour le frontend' })
  getPublicKey() {
    return { publicKey: this.pushService.getPublicKey() };
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Enregistrer un abonnement push' })
  subscribe(
    @Request() req,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.pushService.subscribe(req.user.id, body);
  }

  @Delete('unsubscribe')
  @ApiOperation({ summary: 'Supprimer un abonnement push' })
  unsubscribe(@Request() req, @Body() body: { endpoint: string }) {
    return this.pushService.unsubscribe(req.user.id, body.endpoint);
  }
}
