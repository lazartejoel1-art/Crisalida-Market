import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../pedidos/pedidos.entity';
import { ReportesService } from './reportes.service';
import { ReportesController } from './reportes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido])],
  providers: [ReportesService],
  controllers: [ReportesController],
})
export class ReportesModule {}
