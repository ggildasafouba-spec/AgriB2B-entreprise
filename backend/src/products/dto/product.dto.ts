import { IsString, IsNumber, IsOptional, Min, IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Tomates Bio' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Tomates biologiques fraîches de la région Centre' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'kg', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 'Légumes' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'Région Centre, Cameroun', required: false })
  @IsOptional()
  @IsString()
  productionZone?: string;

  @ApiProperty({
    example: ['https://cdn.example.com/tomate1.jpg'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({
    example: ['ROUTE', 'CHEMIN_DE_FER'],
    description: 'Moyens de transport disponibles : ROUTE, CHEMIN_DE_FER, MARITIME, AERIEN',
    type: [String],
  })
  @IsArray()
  transport: string[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  initialStock: number;

  @ApiProperty({ example: 10, required: false, description: 'Quantité minimale de commande' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;
}

export class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() productionZone?: string;
  @IsOptional() @IsArray() images?: string[];
  @IsOptional() @IsArray() transport?: string[];
  @IsOptional() @IsInt() @Min(1) minOrderQty?: number;
}
