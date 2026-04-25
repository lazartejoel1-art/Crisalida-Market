import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 🔥 ASEGURAR QUE EXISTA LA CARPETA UPLOADS
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }

  // 🔥 SOLUCIÓN CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // 🔥 SERVIR IMÁGENES (ruta absoluta segura)
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  await app.listen(3000);
}
void bootstrap();
