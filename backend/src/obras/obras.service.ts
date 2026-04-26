import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './obra.entity';
import { CreateObraDto } from './dto/create-obra.dto';

function buildImageUrl(imagen?: string | null): string | null {
  if (!imagen) return null;

  if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
    return imagen;
  }

  return imagen;
}

@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private readonly obraRepository: Repository<Obra>,
  ) {}

  async obtenerTodas() {
    const obras = await this.obraRepository.find({
      relations: ['artista'],
    });

    return obras.map((obra) => ({
      ...obra,
      imagen: buildImageUrl(obra.imagen),
      imagenUrl: buildImageUrl(obra.imagen),
    }));
  }

  async obtenerUna(id: number) {
    const obra = await this.obraRepository.findOne({
      where: { id },
      relations: ['artista'],
    });

    if (!obra) {
      throw new NotFoundException('Obra no encontrada');
    }

    return {
      ...obra,
      imagen: buildImageUrl(obra.imagen),
      imagenUrl: buildImageUrl(obra.imagen),
    };
  }

  async crear(dto: CreateObraDto) {
    const obra = this.obraRepository.create({
      ...dto,
      imagen: dto.imagen || dto.imagenUrl || '',
      artista: { id: Number(dto.artistaId) },
    });

    return this.obraRepository.save(obra);
  }

  async eliminar(id: number) {
    return this.obraRepository.delete(id);
  }

  async actualizar(id: number, dto: CreateObraDto) {
    const obra = await this.obraRepository.findOne({
      where: { id },
    });

    if (!obra) {
      throw new NotFoundException('Obra no encontrada');
    }

    Object.assign(obra, {
      ...dto,
      imagen: dto.imagen || dto.imagenUrl || obra.imagen,
      artista: dto.artistaId ? { id: Number(dto.artistaId) } : obra.artista,
    });

    return this.obraRepository.save(obra);
  }
}
