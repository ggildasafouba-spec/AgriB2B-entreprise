import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ArticlesController } from './articles.controller';

@Module({
  providers: [ProductsService],
  controllers: [ProductsController, ArticlesController],
})
export class ProductsModule {}
