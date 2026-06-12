import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryRequestService } from './delivery-request.service';
import { DeliveryController } from './delivery.controller';

@Module({
  providers: [DeliveryService, DeliveryRequestService],
  controllers: [DeliveryController],
  exports: [DeliveryService],
})
export class DeliveryModule {}
