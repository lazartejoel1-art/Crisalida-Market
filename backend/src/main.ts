import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const uploadsPath = join(process.cwd(), 'uploads');

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 10000;

  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Servidor corriendo en puerto ${port}`);
}

void bootstrap();
