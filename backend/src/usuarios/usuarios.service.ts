import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './usuarios.entity';

@Injectable()
export class UsuariosService {
  obtenerTodos(): Promise<Usuario[]> {
    throw new Error('Method not implemented.');
  }
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
  ) {}

  async create(data: Partial<Usuario>) {
    const usuario = this.usuarioRepository.create(data);
    return this.usuarioRepository.save(usuario);
  }

  async findByUsername(username: string) {
    return this.usuarioRepository.findOne({
      where: { username },
    });
  }

  async findAll() {
    return this.usuarioRepository.find();
  }
}
