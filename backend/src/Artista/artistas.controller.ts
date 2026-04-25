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
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { join } from 'path';
import * as fs from 'fs';

import { ArtistasService } from './artistas.service';
import { CrearArtistaDto } from './dto/create-artista.dto';

// 🔥 asegurar que exista la carpeta uploads
const uploadPath = join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
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

  // 🔥 NUEVO ENDPOINT PARA SUBIR IMAGEN
  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
          const filename = uuid() + '-' + file.originalname;
          cb(null, filename);
        },
      }),
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `http://localhost:3000/uploads/${file.filename}`,
    };
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
          const filename = uuid() + '-' + file.originalname;
          cb(null, filename);
        },
      }),
    }),
  )
  crear(
    @Body() dto: CrearArtistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const foto: string | undefined = file?.filename;

    return this.artistasService.crear(dto, foto);
  }

  // 🔥 NUEVO ENDPOINT PARA ACTUALIZAR
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: uploadPath,
        filename: (req, file, cb) => {
          const filename = uuid() + '-' + file.originalname;
          cb(null, filename);
        },
      }),
    }),
  )
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CrearArtistaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const foto: string | undefined = file?.filename;

    return this.artistasService.actualizar(id, dto, foto);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.artistasService.eliminar(id);
  }
}
