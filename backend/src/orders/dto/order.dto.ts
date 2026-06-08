import { IsArray, IsString, IsNumber, Min, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false, description: 'Option de livraison choisie (JSON string)' })
  @IsOptional()
  @IsString()
  deliveryOption?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED'] })
  @IsString()
  status: string;
}

export class UpdateOrderDto {
  @ApiProperty({ type: [OrderItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recipientPhone?: string;
}
