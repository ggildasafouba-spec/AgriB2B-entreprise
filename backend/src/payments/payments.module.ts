import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { CommissionService } from '../common/commission.service';

@Module({
  providers: [PaymentsService, CommissionService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
