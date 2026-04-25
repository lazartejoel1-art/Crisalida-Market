import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateObraDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  tecnica: string;

  @IsNumber()
  precio: number;

  @IsOptional()
  @IsString()
  imagen?: string;

  // 🔥 opcional para evitar errores si no se envía imagen
  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsNumber()
  artistaId: number;
}
