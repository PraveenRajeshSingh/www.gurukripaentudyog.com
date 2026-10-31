// NestJS decorators rely on the reflect-metadata polyfill being loaded before
// any @Injectable/@Controller class is evaluated.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Brick Supply Multi-Tenant SaaS Backend running on http://localhost:${port}`);
}

if (require.main === module) {
  bootstrap();
}
