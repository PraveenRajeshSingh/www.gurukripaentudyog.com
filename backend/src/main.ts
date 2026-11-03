// NestJS decorators rely on the reflect-metadata polyfill being loaded before
// any @Injectable/@Controller class is evaluated.
import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Enquiry photo attachments arrive as data-URLs; allow up to 5 MB bodies.
    bodyParser: false,
  });
  const express = require('express');
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

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
}

if (require.main === module) {
  bootstrap();
}
