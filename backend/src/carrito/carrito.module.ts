import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Carrito } from './carrito.entity';
import { CarritoService } from './carrito.service';
import { CarritoController } from './carrito.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Carrito])],

  providers: [CarritoService],

  controllers: [CarritoController],
})
export class CarritoModule {}
