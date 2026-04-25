import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuarios.entity';
import { UsuariosService } from './usuarios.service';
import { UsuarioController } from './usuario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],
  providers: [UsuariosService],
  controllers: [UsuarioController],
  exports: [UsuariosService],
})
export class UsuariosModule {}
