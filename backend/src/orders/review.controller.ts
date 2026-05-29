import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: 'Laisser un avis après livraison' })
  create(@Body() body: { orderId: string; targetId: string; rating: number; comment?: string; type: string }, @Request() req: any) {
    return this.reviewService.create(req.user.id, body);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Avis d\'un utilisateur' })
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewService.getUserReviews(userId);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Avis d\'une commande' })
  getOrderReviews(@Param('orderId') orderId: string) {
    return this.reviewService.getOrderReviews(orderId);
  }
}
