import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Usuario } from './usuarios.entity';

@Injectable()
export class UsuariosService {
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
      where: { username: ILike(username) },
    });
  }

  async findAll() {
    return this.usuarioRepository.find();
  }

  obtenerTodos(): Promise<Usuario[]> {
    return this.findAll();
  }
}
