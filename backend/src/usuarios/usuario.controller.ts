import { Controller, Get } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { Usuario } from './usuarios.entity';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async obtenerTodos(): Promise<Usuario[]> {
    return await this.usuariosService.obtenerTodos();
  }
}
