import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['SELLER', 'BUYER', 'TRANSPORTER'] })
  @IsEnum(['SELLER', 'BUYER', 'TRANSPORTER'])
  role: string;

  @ApiProperty({ enum: ['INDIVIDUAL', 'COMPANY'] })
  @IsEnum(['INDIVIDUAL', 'COMPANY'])
  accountType: string;

  @ApiProperty({ example: '+237600000000' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Cameroun' })
  @IsString()
  country: string;

  @ApiProperty({ example: 'Centre' })
  @IsString()
  region: string;

  @ApiProperty({ example: 10, required: false, description: 'Quantité minimale de commande (particulier vendeur)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;

  @ApiProperty({ example: 'Registre de commerce', required: false })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ example: 'https://...', required: false })
  @IsOptional()
  @IsString()
  documentUrl?: string;
}

export class VerifyCodeDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '482931' })
  @IsString()
  code: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jean@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  password: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Jean Dupont', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+237600000000', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Cameroun', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Centre', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../logo.webp', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;
}
