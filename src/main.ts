import { NestFactory } from '@nestjs/core';
import { json } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';

const PROXY_PREFIXES = ['/patients', '/doctors', '/appointments', '/telemedicine', '/notifications', '/symptom-checker'];

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(cookieParser());

  app.use((req: any, res: any, next: any) => {
    const isProxy = PROXY_PREFIXES.some((p) => req.path.startsWith(p));
    if (isProxy) return next();
    json()(req, res, next);
  });

  // CORS_ORIGIN is set via ConfigMap. In prod this should be the CloudFront URL
  // (and optionally the Vercel frontend URL). Falls back to localhost for local dev.
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: allowedOrigins, credentials: true });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
