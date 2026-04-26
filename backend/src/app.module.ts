import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UsuariosModule } from './usuarios/usuarios.module';
import { AuthModule } from './auth/auth.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { ObrasModule } from './obras/obras.module';
import { CarritoModule } from './carrito/carrito.module';
import { ArtistasModule } from './Artista/artistas.module';
import { ReportesModule } from './reportes/reportes.module';
import { AnalyticsModule } from './analytics/analytics.module';

import { Usuario } from './usuarios/usuarios.entity';
import { Pedido } from './pedidos/pedidos.entity';
import { Obra } from './obras/obra.entity';
import { Artista } from './Artista/artista.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Usuario, Pedido, Obra, Artista],
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    }),

    UsuariosModule,
    AuthModule,
    PedidosModule,
    ObrasModule,
    CarritoModule,
    ArtistasModule,
    ReportesModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
