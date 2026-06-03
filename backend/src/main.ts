import 'reflect-metadata';
console.log('[BOOT] main.ts loaded');
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  console.log('[BOOT] bootstrap() called');

  const app = await NestFactory.create(AppModule);

  // CORS — accepter les requêtes du frontend (Vercel en prod, localhost en dev)
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://www.mboamarket.africa',
    'https://mboamarket.africa',
    'https://agri-b2-b-entreprise.vercel.app',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      // En dev, autoriser tout
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      // En prod, autoriser quand même mais logger
      return callback(null, true);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Health check endpoint
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/health', (_req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const config = new DocumentBuilder()
    .setTitle('AgriB2B API')
    .setDescription('API B2B pour la plateforme agricole AgriB2B')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`AgriB2B Backend running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
