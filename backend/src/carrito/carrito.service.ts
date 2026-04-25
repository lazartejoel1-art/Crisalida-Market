import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Carrito } from './carrito.entity';

@Injectable()
export class CarritoService {
  constructor(
    @InjectRepository(Carrito)
    private carritoRepo: Repository<Carrito>,
  ) {}

  async agregar(usuarioId: number, obraId: number, cantidad: number) {
    const item = this.carritoRepo.create({
      usuarioId,
      obraId,
      cantidad,
    });

    return this.carritoRepo.save(item);
  }

  async obtenerCarrito(usuarioId: number) {
    return this.carritoRepo.find({
      where: { usuarioId },
    });
  }

  async eliminar(id: number) {
    return this.carritoRepo.delete(id);
  }
}
