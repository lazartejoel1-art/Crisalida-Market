import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuariosService } from '../usuarios/usuarios.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async register(username: string, password: string) {
    const hashedPassword: string = await bcrypt.hash(password, 10);

    const nuevoUsuario = await this.usuariosService.create({
      username,
      password: hashedPassword,
    });

    return nuevoUsuario;
  }

  async validateUser(username: string, password: string) {
    const user = await this.usuariosService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const passwordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
