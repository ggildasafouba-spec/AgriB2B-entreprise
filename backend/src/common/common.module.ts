import { Global, Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { SmsAlertService } from './sms-alert.service';

@Global()
@Module({
  providers: [CommissionService, SmsAlertService],
  exports: [CommissionService, SmsAlertService],
})
export class CommonModule {}
