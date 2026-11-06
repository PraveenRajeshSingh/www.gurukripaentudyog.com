"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("dotenv/config");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
        console.error('[fatal] JWT_SECRET is required when NODE_ENV=production. Refusing to start.');
        process.exit(1);
    }
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL && !process.env.DB_HOST) {
        console.warn('[startup] DATABASE_URL / DB_HOST not set — store may run in memory/mock mode. Configure PostgreSQL for production.');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
    const express = require('express');
    app.use(express.json({ limit: '5mb' }));
    app.use(express.urlencoded({ extended: true, limit: '5mb' }));
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }));
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:8080,https://www.gurukripaentudyog.com,https://gurukripaentudyog.com')
        .split(',')
        .map((s) => s.trim());
    app.enableCors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin))
                return cb(null, true);
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
//# sourceMappingURL=main.js.map