import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { StockModule } from './stock/stock.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KycModule } from './kyc/kyc.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MessagesModule } from './messages/messages.module';
import { TransportModule } from './transport/transport.module';
import { DeliveryModule } from './delivery/delivery.module';
import { JournalModule } from './journal/journal.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    StockModule,
    OrdersModule,
    NotificationsModule,
    KycModule,
    AdminModule,
    PaymentsModule,
    InvoicesModule,
    MessagesModule,
    TransportModule,
    DeliveryModule,
    JournalModule,
    UploadModule,
  ],
})
export class AppModule {}
