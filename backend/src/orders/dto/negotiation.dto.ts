import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNegotiationDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  proposedPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}

export class RespondNegotiationDto {
  @ApiProperty({ enum: ['ACCEPTED', 'REJECTED', 'COUNTER'] })
  @IsString()
  action: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  counterPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  message?: string;
}
