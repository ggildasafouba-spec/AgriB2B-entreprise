import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

// PushModule est @Global() donc PushService est disponible sans import explicite

@Module({
  providers:   [NotificationsService],
  controllers: [NotificationsController],
  exports:     [NotificationsService],
})
export class NotificationsModule {}
