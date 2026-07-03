import { Module } from '@nestjs/common';
import { ClassifiedsController } from './classifieds.controller';
import { EquipmentController } from './equipment.controller';

@Module({
  controllers: [ClassifiedsController, EquipmentController],
})
export class ClassifiedsModule {}
