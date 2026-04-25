import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './obra.entity';
import { CreateObraDto } from './dto/create-obra.dto';

const API_URL =
  process.env.API_PUBLIC_URL || 'https://crisalida-market.onrender.com';

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
      imagen: obra.imagen ? `uploads/${obra.imagen}` : null,
      imagenUrl: obra.imagen ? `${API_URL}/uploads/${obra.imagen}` : null,
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
      imagen: obra.imagen ? `uploads/${obra.imagen}` : null,
      imagenUrl: obra.imagen ? `${API_URL}/uploads/${obra.imagen}` : null,
    };
  }

  async crear(dto: CreateObraDto) {
    const obra = this.obraRepository.create({
      ...dto,
      artista: { id: dto.artistaId },
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

    Object.assign(obra, dto);

    return this.obraRepository.save(obra);
  }
}
