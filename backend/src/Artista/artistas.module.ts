import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Artista } from './artista.entity';
import { ArtistasController } from './artistas.controller';
import { ArtistasService } from './artistas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Artista])],
  controllers: [ArtistasController],
  providers: [ArtistasService],
})
export class ArtistasModule {}
