import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { Pedido } from './pedidos.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  async obtenerTodos(): Promise<Pedido[]> {
    return await this.pedidosService.obtenerTodos();
  }

  @Post()
  async crear(@Body() body: CreatePedidoDto): Promise<Pedido> {
    return await this.pedidosService.crear(body);
  }

  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { estado: string },
  ): Promise<Pedido> {
    return await this.pedidosService.actualizarEstado(id, body.estado);
  }

  @Patch(':id/pago-reportado')
  async reportarPago(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { yaPago?: boolean; comprobante?: string },
  ): Promise<Pedido> {
    return await this.pedidosService.reportarPago(id, body);
  }
}
