// NestJS decorators rely on the reflect-metadata polyfill being loaded before
// any @Injectable/@Controller class is evaluated.
import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('[fatal] JWT_SECRET is required when NODE_ENV=production. Refusing to start.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.warn('[startup] DATABASE_URL / DB_HOST not set — store may run in memory/mock mode. Configure PostgreSQL for production.');
  }

  const app = await NestFactory.create(AppModule, {
    // Enquiry photo attachments arrive as data-URLs; allow up to 5 MB bodies.
    bodyParser: false,
  });
  const express = require('express');
  // Capture raw body for Razorpay webhook HMAC (route-scoped).
  app.use(
    express.json({
      limit: '5mb',
      verify: (req: any, _res, buf) => {
        if (req.originalUrl && String(req.originalUrl).includes('/webhooks/razorpay')) {
          req.rawBody = Buffer.from(buf);
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Baseline security headers (Helmet-equivalent without new dependency).
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Requirement F: strict input validation + CORS restricted to known origins.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }),
  );
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080,https://www.gurukripaentudyog.com,https://gurukripaentudyog.com')
    .split(',')
    .map((s) => s.trim());
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    maxAge: 86400,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Brick Supply Multi-Tenant SaaS Backend running on http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
}

if (require.main === module) {
  bootstrap();
}
