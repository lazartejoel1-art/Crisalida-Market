import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from '../usuarios/usuarios.module'; // <- IMPORTAR MÓDULO USUARIO

@Module({
  imports: [
    UsuariosModule, // <- aquí
    JwtModule.register({
      secret: 'CRISALIDA_SECRET_KEY',
      signOptions: { expiresIn: '6h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
