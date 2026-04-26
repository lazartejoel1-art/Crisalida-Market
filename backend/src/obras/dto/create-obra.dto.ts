import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateObraDto {
  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tecnica?: string;

  @Type(() => Number)
  @IsNumber()
  precio!: number;

  @Type(() => Number)
  @IsNumber()
  stock!: number;

  @Type(() => Number)
  @IsNumber()
  artistaId!: number;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;
}
