import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryRequestService } from './delivery-request.service';
import { DeliveryController } from './delivery.controller';
import { NotchPayService } from '../payments/notchpay.service';

@Module({
  providers: [DeliveryService, DeliveryRequestService, NotchPayService],
  controllers: [DeliveryController],
  exports: [DeliveryService],
})
export class DeliveryModule {}
