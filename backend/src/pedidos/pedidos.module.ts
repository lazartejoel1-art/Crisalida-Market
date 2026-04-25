import { Module } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedidos.entity';
import { Obra } from '../obras/obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Obra])],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
