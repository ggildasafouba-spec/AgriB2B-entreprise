import { Module } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';
import { CommodityPricesService } from './commodity-prices.service';

@Module({
  providers: [JournalService, CommodityPricesService],
  controllers: [JournalController],
})
export class JournalModule {}
