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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

const API_URL =
  process.env.API_PUBLIC_URL || 'https://crisalida-market.onrender.com';

const uploadPath = join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

@Controller('obras')
export class ObrasController {
  constructor(private readonly obrasService: ObrasService) {}

  @Get()
  obtenerTodas() {
    return this.obrasService.obtenerTodas();
  }

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
          const nombre = Date.now() + extname(file.originalname);
          cb(null, nombre);
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `${API_URL}/uploads/${file.filename}`,
      filename: file.filename,
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => {
          const nombre = Date.now() + extname(file.originalname);
          callback(null, nombre);
        },
      }),
    }),
  )
  crear(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateObraDto,
  ): Promise<Obra> {
    if (file) {
      body.imagen = file.filename;
    } else {
      body.imagen = 'default.jpg';
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
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, callback) => {
          const nombre = Date.now() + extname(file.originalname);
          callback(null, nombre);
        },
      }),
    }),
  )
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateObraDto,
  ) {
    if (file) {
      body.imagen = file.filename;
    }

    return this.obrasService.actualizar(id, body);
  }
}
