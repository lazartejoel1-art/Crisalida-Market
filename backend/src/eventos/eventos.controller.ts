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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

import { EventosService } from './eventos.service';
import { ArtistaInvitadoEvento, Evento } from './evento.entity';

type EventoBody = {
  titulo?: string;
  descripcion?: string;
  fecha?: string;
  lugar?: string;
  activo?: string | boolean;
  artistasInvitados?: string;
};

type EventoFile = {
  filename: string;
};

const uploadsPath = join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

const flyerStorage = diskStorage({
  destination: uploadsPath,
  filename: (_req, file, callback) => {
    const fileExt = extname(file.originalname);
    const fileName = `evento-${Date.now()}-${Math.round(
      Math.random() * 1000000,
    )}${fileExt}`;

    callback(null, fileName);
  },
});

function isArtistaInvitadoEvento(
  value: unknown,
): value is ArtistaInvitadoEvento {
  if (typeof value !== 'object' || value === null) return false;

  const item = value as Record<string, unknown>;

  return typeof item.nombre === 'string';
}

function parseArtistasInvitados(value?: string): ArtistaInvitadoEvento[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isArtistaInvitadoEvento);
  } catch {
    return [];
  }
}

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

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Evento> {
    return this.eventosService.findOne(Number(id));
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('flyer', {
      storage: flyerStorage,
    }),
  )
  create(
    @Body() body: EventoBody,
    @UploadedFile() file?: EventoFile,
  ): Promise<Evento> {
    const flyer = file?.filename ?? null;

    const data: Partial<Evento> = {
      titulo: body.titulo ?? '',
      descripcion: body.descripcion ?? '',
      fecha: body.fecha ?? '',
      lugar: body.lugar ?? '',
      activo: body.activo === 'false' ? false : true,
      flyer: flyer ?? undefined,
      flyerUrl: flyer ? `/uploads/${flyer}` : undefined,
      artistasInvitados: parseArtistasInvitados(body.artistasInvitados),
    };

    return this.eventosService.create(data);
  }

  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('flyer', {
      storage: flyerStorage,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() body: EventoBody,
    @UploadedFile() file?: EventoFile,
  ): Promise<Evento> {
    const flyer = file?.filename ?? null;

    const data: Partial<Evento> = {
      titulo: body.titulo ?? '',
      descripcion: body.descripcion ?? '',
      fecha: body.fecha ?? '',
      lugar: body.lugar ?? '',
      activo: body.activo === 'false' ? false : true,
      artistasInvitados: parseArtistasInvitados(body.artistasInvitados),
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
