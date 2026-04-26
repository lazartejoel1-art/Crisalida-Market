import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './obra.entity';
import { CreateObraDto } from './dto/create-obra.dto';
import { Artista } from '../Artista/artista.entity';

function buildImageUrl(imagen?: string | null): string | null {
  if (!imagen) return null;

  const value = String(imagen).trim();
  if (!value) return null;

  return value;
}

function buildArtistaRelation(artistaId: number): Artista {
  const artista = new Artista();
  artista.id = Number(artistaId);
  return artista;
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

    return obras.map((obra) => {
      const imageValue = buildImageUrl(obra.imagenUrl || obra.imagen);

      return {
        ...obra,
        imagen: imageValue,
        imagenUrl: imageValue,
      };
    });
  }

  async obtenerUna(id: number) {
    const obra = await this.obraRepository.findOne({
      where: { id },
      relations: ['artista'],
    });

    if (!obra) {
      throw new NotFoundException('Obra no encontrada');
    }

    const imageValue = buildImageUrl(obra.imagenUrl || obra.imagen);

    return {
      ...obra,
      imagen: imageValue,
      imagenUrl: imageValue,
    };
  }

  async crear(dto: CreateObraDto) {
    const imageValue = buildImageUrl(dto.imagenUrl || dto.imagen);

    const obra = new Obra();

    obra.titulo = dto.titulo;
    obra.descripcion = dto.descripcion || '';
    obra.precio = Number(dto.precio);
    obra.stock = Number(dto.stock ?? 0);
    obra.imagen = imageValue || '';
    obra.imagenUrl = imageValue || '';
    obra.artista = buildArtistaRelation(Number(dto.artistaId));

    return this.obraRepository.save(obra);
  }

  async eliminar(id: number) {
    return this.obraRepository.delete(id);
  }

  async actualizar(id: number, dto: CreateObraDto) {
    const obra = await this.obraRepository.findOne({
      where: { id },
      relations: ['artista'],
    });

    if (!obra) {
      throw new NotFoundException('Obra no encontrada');
    }

    const imageValue = buildImageUrl(
      dto.imagenUrl || dto.imagen || obra.imagenUrl || obra.imagen,
    );

    obra.titulo = dto.titulo ?? obra.titulo;
    obra.descripcion = dto.descripcion ?? obra.descripcion;

    obra.precio =
      dto.precio !== undefined && dto.precio !== null
        ? Number(dto.precio)
        : obra.precio;

    obra.stock =
      dto.stock !== undefined && dto.stock !== null
        ? Number(dto.stock)
        : obra.stock;

    obra.imagen = imageValue || obra.imagen || '';
    obra.imagenUrl = imageValue || obra.imagenUrl || obra.imagen || '';

    if (dto.artistaId) {
      obra.artista = buildArtistaRelation(Number(dto.artistaId));
    }

    return this.obraRepository.save(obra);
  }
}
