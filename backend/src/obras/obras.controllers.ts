import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { ObrasService } from './obras.service';
import { CreateObraDto } from './dto/create-obra.dto';
import { Obra } from './obra.entity';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50 MB

const imageUploadOptions = {
  limits: {
    fileSize: MAX_IMAGE_SIZE,
  },
};

function uploadToCloudinary(
  file: Express.Multer.File,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se recibió ninguna imagen'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'crisalida-market/obras',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(new Error(error.message || 'Error uploading image'));
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

@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Get()
  obtenerTodas() {
    return this.obrasService.obtenerTodas();
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const result = await uploadToCloudinary(file);

    return {
      url: result.secure_url,
      filename: result.secure_url,
      imagen: result.secure_url,
      imagenUrl: result.secure_url,
    };
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagen', imageUploadOptions))
  async crear(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateObraDto,
  ): Promise<Obra> {
    if (file) {
      const result = await uploadToCloudinary(file);

      body.imagen = result.secure_url;
      body.imagenUrl = result.secure_url;
    }

    if (!body.imagen && body.imagenUrl) {
      body.imagen = body.imagenUrl;
    }

    if (!body.imagenUrl && body.imagen) {
      body.imagenUrl = body.imagen;
    }

    return this.obrasService.crear(body);
  }

  @Get(':id')
  obtenerUna(@Param('id', ParseIntPipe) id: number) {
    return this.obrasService.obtenerUna(id);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.obrasService.eliminar(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('imagen', imageUploadOptions))
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateObraDto,
  ) {
    if (file) {
      const result = await uploadToCloudinary(file);

      body.imagen = result.secure_url;
      body.imagenUrl = result.secure_url;
    }

    if (!body.imagen && body.imagenUrl) {
      body.imagen = body.imagenUrl;
    }

    if (!body.imagenUrl && body.imagen) {
      body.imagenUrl = body.imagen;
    }

    return this.obrasService.actualizar(id, body);
  }
}
