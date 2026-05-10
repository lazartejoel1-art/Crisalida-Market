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
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se recibió ninguna imagen'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Error al subir imagen'));
        }

        if (!result) {
          return reject(new Error('No se pudo subir la imagen'));
        }

        resolve(result);
      },
    );

    uploadStream.end(file.buffer);
  });
}

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

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await uploadToCloudinary(
      file,
      'crisalida-market/eventos/invitados',
    );

    return {
      url: result.secure_url,
      filename: result.secure_url,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('flyer'))
  async create(
    @Body() body: EventoBody,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Evento> {
    let flyer: string | undefined;

    if (file) {
      const result = await uploadToCloudinary(
        file,
        'crisalida-market/eventos/flyers',
      );

      flyer = result.secure_url;
    }

    const data: Partial<Evento> = {
      titulo: body.titulo ?? '',
      descripcion: body.descripcion ?? '',
      fecha: body.fecha ?? '',
      lugar: body.lugar ?? '',
      activo: body.activo === 'false' ? false : true,
      flyer: flyer ?? undefined,
      flyerUrl: flyer ?? undefined,
      artistasInvitados: parseArtistasInvitados(body.artistasInvitados),
    };

    return this.eventosService.create(data);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('flyer'))
  async update(
    @Param('id') id: string,
    @Body() body: EventoBody,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Evento> {
    let flyer: string | undefined;

    if (file) {
      const result = await uploadToCloudinary(
        file,
        'crisalida-market/eventos/flyers',
      );

      flyer = result.secure_url;
    }

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
      data.flyerUrl = flyer;
    }

    return this.eventosService.update(Number(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.eventosService.remove(Number(id));
  }
}
