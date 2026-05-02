import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './evento.entity';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventosRepository: Repository<Evento>,
  ) {}

  findAll() {
    return this.eventosRepository.find({
      order: { id: 'DESC' },
    });
  }

  findActivos() {
    return this.eventosRepository.find({
      where: { activo: true },
      order: { id: 'DESC' },
    });
  }

  async create(data: Partial<Evento>) {
    const evento = this.eventosRepository.create(data);
    return this.eventosRepository.save(evento);
  }

  async update(id: number, data: Partial<Evento>) {
    const evento = await this.eventosRepository.findOne({ where: { id } });

    if (!evento) {
      throw new NotFoundException('Evento no encontrado.');
    }

    Object.assign(evento, data);
    return this.eventosRepository.save(evento);
  }

  async remove(id: number) {
    const evento = await this.eventosRepository.findOne({ where: { id } });

    if (!evento) {
      throw new NotFoundException('Evento no encontrado.');
    }

    await this.eventosRepository.remove(evento);

    return {
      message: 'Evento eliminado correctamente.',
    };
  }
}
