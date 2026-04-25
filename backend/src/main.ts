import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Crear carpeta uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }

  // CORS
  app.enableCors({
    origin: true, // 🔥 importante para producción
    credentials: true,
  });

  // Archivos estáticos
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // 🔥 ESTE ES EL CAMBIO CLAVE
  const port = process.env.PORT || 10000;

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servidor corriendo en puerto ${port}`);
}

void bootstrap();
