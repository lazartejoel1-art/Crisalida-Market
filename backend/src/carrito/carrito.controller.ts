import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { CarritoService } from './carrito.service';

interface AgregarCarritoDto {
  usuarioId: number;
  obraId: number;
  cantidad: number;
}

@Controller('carrito')
export class CarritoController {
  constructor(private carritoService: CarritoService) {}

  @Post('agregar')
  agregar(@Body() body: AgregarCarritoDto) {
    const { usuarioId, obraId, cantidad } = body;
    return this.carritoService.agregar(usuarioId, obraId, cantidad);
  }

  @Get(':usuarioId')
  obtener(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.carritoService.obtenerCarrito(usuarioId);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.carritoService.eliminar(id);
  }
}
