import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artista } from './artista.entity';
import { CrearArtistaDto } from './dto/create-artista.dto';

function buildImageUrl(image?: string | null): string | null {
  if (!image) return null;

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }

  return image;
}

function cleanValue(value?: string | null): string {
  return value?.trim() ?? '';
}

@Injectable()
export class ArtistasService {
  constructor(
    @InjectRepository(Artista)
    private readonly artistaRepository: Repository<Artista>,
  ) {}

  async obtenerTodos() {
    const artistas = await this.artistaRepository.find({
      order: { id: 'ASC' },
    });

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
        imagen: buildImageUrl(o.imagen),
        imagenUrl: buildImageUrl(o.imagen),
      })),
    };
  }

  async crear(dto: CrearArtistaDto, foto?: string) {
    const artista = this.artistaRepository.create({
      nombre: cleanValue(dto.nombre),
      descripcion: cleanValue(dto.descripcion),
      instagram: cleanValue(dto.instagram),
      facebook: cleanValue(dto.facebook),
      tiktok: cleanValue(dto.tiktok),
      correo: cleanValue(dto.correo),
      web: cleanValue(dto.web),
      foto: foto || cleanValue(dto.fotoUrl) || undefined,
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

    artista.nombre = cleanValue(dto.nombre);
    artista.descripcion = cleanValue(dto.descripcion);
    artista.instagram = cleanValue(dto.instagram);
    artista.facebook = cleanValue(dto.facebook);
    artista.tiktok = cleanValue(dto.tiktok);
    artista.correo = cleanValue(dto.correo);
    artista.web = cleanValue(dto.web);

    if (foto) {
      artista.foto = foto;
    } else if (dto.fotoUrl && dto.fotoUrl.trim()) {
      artista.foto = dto.fotoUrl.trim();
    }

    return this.artistaRepository.save(artista);
  }

  async eliminar(id: number) {
    return this.artistaRepository.delete(id);
  }
}
