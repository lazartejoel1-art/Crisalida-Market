import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Pedido } from '../pedidos/pedidos.entity';
import { Obra } from '../obras/obra.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Obra])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
