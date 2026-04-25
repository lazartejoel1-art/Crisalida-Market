import {
  IsString,
  IsOptional,
  IsEmail,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class PedidoItemDto {
  @IsNumber()
  obraId: number;

  @IsNumber()
  cantidad: number;
}

export class CreatePedidoDto {
  @IsString()
  buyerName: string;

  @IsEmail()
  buyerEmail: string;

  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @IsOptional()
  @IsString()
  buyerNote?: string;

  @IsString()
  metodoPago: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  items: PedidoItemDto[];

  @IsOptional()
  @IsNumber()
  usuarioId?: number;

  @IsOptional()
  @IsNumber()
  total?: number;

  @IsOptional()
  @IsBoolean()
  yaPago?: boolean;

  @IsOptional()
  @IsString()
  comprobante?: string;
}
