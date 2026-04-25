import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Artista } from './Artista/artista.entity';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Controller('artistas')
export class ArtistaController {
  constructor(
    @InjectRepository(Artista)
    private readonly artistaRepository: Repository<Artista>,
  ) {}

  @Get()
  obtenerTodos(): Promise<Artista[]> {
    return this.artistaRepository.find();
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (req, file, cb) => {
          const nombre = uuid() + '-' + file.originalname;
          cb(null, nombre);
        },
      }),
    }),
  )
  async crear(
    @Body() body: Partial<Artista>,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Artista> {
    const artista = this.artistaRepository.create({
      ...body,
      foto: file?.filename,
    });

    return this.artistaRepository.save(artista);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.artistaRepository.delete(id);
  }
}
