import { IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  orderId: string;

  @ApiProperty({ enum: ['MTN_MOMO', 'ORANGE_MONEY', 'MANUAL'] })
  @IsEnum(['MTN_MOMO', 'ORANGE_MONEY', 'MANUAL'])
  provider: string;

  @ApiProperty({ example: '+237677000001' })
  @IsString()
  phone: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({ enum: ['SUCCESS', 'FAILED'] })
  @IsEnum(['SUCCESS', 'FAILED'])
  status: 'SUCCESS' | 'FAILED';
}
