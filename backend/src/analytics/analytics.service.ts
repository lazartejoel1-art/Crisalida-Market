import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Visita } from './analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Visita)
    private visitaRepo: Repository<Visita>,
  ) {}

  registrarVisita() {
    const visita = this.visitaRepo.create();
    return this.visitaRepo.save(visita);
  }

  async totalVisitas() {
    return this.visitaRepo.count();
  }
}
