import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EventosService } from './eventos.service';
import { Evento } from './evento.entity';

type EventoBody = {
  titulo?: string;
  descripcion?: string;
  fecha?: string;
  lugar?: string;
  activo?: string | boolean;
};

type EventoFile = {
  filename: string;
};

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get()
  findAll(): Promise<Evento[]> {
    return this.eventosService.findAll();
  }

  @Get('activos')
  findActivos(): Promise<Evento[]> {
    return this.eventosService.findActivos();
  }

  @Post()
  @UseInterceptors(FileInterceptor('flyer'))
  create(
    @Body() body: EventoBody,
    @UploadedFile() file?: EventoFile,
  ): Promise<Evento> {
    const flyer = file?.filename;

    const data: Partial<Evento> = {
      titulo: body.titulo ?? '',
      descripcion: body.descripcion ?? '',
      fecha: body.fecha ?? '',
      lugar: body.lugar ?? '',
      activo: body.activo === 'false' ? false : true,
      flyer: flyer ?? undefined,
      flyerUrl: flyer ? `/uploads/${flyer}` : undefined,
    };

    return this.eventosService.create(data);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('flyer'))
  update(
    @Param('id') id: string,
    @Body() body: EventoBody,
    @UploadedFile() file?: EventoFile,
  ): Promise<Evento> {
    const flyer = file?.filename;

    const data: Partial<Evento> = {
      titulo: body.titulo ?? '',
      descripcion: body.descripcion ?? '',
      fecha: body.fecha ?? '',
      lugar: body.lugar ?? '',
      activo: body.activo === 'false' ? false : true,
    };

    if (flyer) {
      data.flyer = flyer;
      data.flyerUrl = `/uploads/${flyer}`;
    }

    return this.eventosService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.eventosService.remove(Number(id));
  }
}
