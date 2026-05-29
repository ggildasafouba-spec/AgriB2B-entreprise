import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InstallmentService } from './installment.service';
import { InstallmentController } from './installment.controller';
import { CommissionService } from '../common/commission.service';

@Module({
  providers: [PaymentsService, InstallmentService, CommissionService],
  controllers: [PaymentsController, InstallmentController],
})
export class PaymentsModule {}
