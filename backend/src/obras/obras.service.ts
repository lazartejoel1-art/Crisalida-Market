import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Obra } from './obra.entity';
import { CreateObraDto } from './dto/create-obra.dto';

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

      // 🔥 AGREGADO para que el frontend pueda cargar la imagen
      imagen: obra.imagen ? `uploads/${obra.imagen}` : null,

      imagenUrl: obra.imagen
        ? `http://localhost:3000/uploads/${obra.imagen}`
        : null,
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

      // 🔥 AGREGADO para que el frontend pueda cargar la imagen
      imagen: obra.imagen ? `uploads/${obra.imagen}` : null,

      imagenUrl: obra.imagen
        ? `http://localhost:3000/uploads/${obra.imagen}`
        : null,
    };
  }

  async crear(dto: CreateObraDto) {
    const obra = this.obraRepository.create({
      ...dto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      artista: { id: dto.artistaId } as any,
    });

    return this.obraRepository.save(obra);
  }

  async eliminar(id: number) {
    return this.obraRepository.delete(id);
  }

  // 🔥 MÉTODO NUEVO PARA ACTUALIZAR
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
