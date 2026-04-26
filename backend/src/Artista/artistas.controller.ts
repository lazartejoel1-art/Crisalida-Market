import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

import { ArtistasService } from './artistas.service';
import { CrearArtistaDto } from './dto/create-artista.dto';

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

@Controller('artistas')
export class ArtistasController {
  constructor(private readonly artistasService: ArtistasService) {}

  @Get()
  obtenerTodos() {
    return this.artistasService.obtenerTodos();
  }

  @Get(':id')
  obtenerUno(@Param('id', ParseIntPipe) id: number) {
    return this.artistasService.obtenerUno(id);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await uploadToCloudinary(file, 'crisalida-market/artistas');

    return {
      url: result.secure_url,
      filename: result.secure_url,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('foto'))
  async crear(
    @Body() dto: CrearArtistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let foto: string | undefined;

    if (file) {
      const result = await uploadToCloudinary(
        file,
        'crisalida-market/artistas',
      );
      foto = result.secure_url;
    }

    return this.artistasService.crear(dto, foto);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('foto'))
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearArtistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let foto: string | undefined;

    if (file) {
      const result = await uploadToCloudinary(
        file,
        'crisalida-market/artistas',
      );
      foto = result.secure_url;
    }

    return this.artistasService.actualizar(id, dto, foto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.artistasService.eliminar(id);
  }
}
