import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artista } from './artista.entity';
import { CrearArtistaDto } from './dto/create-artista.dto';

const API_URL =
  process.env.API_PUBLIC_URL || 'https://crisalida-market.onrender.com';

function buildImageUrl(image?: string | null): string | null {
  if (!image) return null;

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return `${API_URL}/uploads/${image}`;
}

@Injectable()
export class ArtistasService {
  constructor(
    @InjectRepository(Artista)
    private readonly artistaRepository: Repository<Artista>,
  ) {}

  async obtenerTodos() {
    const artistas = await this.artistaRepository.find();

    return artistas.map((a) => ({
      ...a,
      fotoUrl: buildImageUrl(a.foto),
    }));
  }

  async obtenerUno(id: number) {
    const artista = await this.artistaRepository.findOne({
      where: { id },
      relations: ['obras'],
    });

    if (!artista) {
      throw new NotFoundException('Artista no encontrado');
    }

    return {
      ...artista,
      fotoUrl: buildImageUrl(artista.foto),
      obras: artista.obras?.map((o) => ({
        ...o,
        imagenUrl: buildImageUrl(o.imagen),
      })),
    };
  }

  async crear(dto: CrearArtistaDto, foto?: string) {
    const artista = this.artistaRepository.create({
      ...dto,
      foto,
    });

    return this.artistaRepository.save(artista);
  }

  async actualizar(id: number, dto: CrearArtistaDto, foto?: string) {
    const artista = await this.artistaRepository.findOne({
      where: { id },
    });

    if (!artista) {
      throw new NotFoundException('Artista no encontrado');
    }

    if (foto) {
      artista.foto = foto;
    }

    Object.assign(artista, dto);

    return this.artistaRepository.save(artista);
  }

  async eliminar(id: number) {
    return this.artistaRepository.delete(id);
  }
}
