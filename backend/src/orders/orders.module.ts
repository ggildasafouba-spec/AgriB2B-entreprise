import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NegotiationService } from './negotiation.service';
import { NegotiationController } from './negotiation.controller';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { NotchPayService } from '../payments/notchpay.service';

@Module({
  providers: [OrdersService, NegotiationService, ReviewService, NotchPayService],
  controllers: [OrdersController, NegotiationController, ReviewController],
})
export class OrdersModule {}
