import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Obra } from './obra.entity';
import { ObrasService } from './obras.service';
import { ObrasController } from './obras.controllers';

@Module({
  imports: [TypeOrmModule.forFeature([Obra])],
  providers: [ObrasService],
  controllers: [ObrasController],
})
export class ObrasModule {}
