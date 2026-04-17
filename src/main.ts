import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

const PROXY_PREFIXES = ['/patients', '/doctors', '/appointments', '/telemedicine', '/notifications', '/symptom-checker'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use((req: any, res: any, next: any) => {
    const isProxy = PROXY_PREFIXES.some((p) => req.path.startsWith(p));
    if (isProxy) return next();
    json()(req, res, next);
  });

  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
