import 'reflect-metadata';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import path from 'node:path';
import { json, urlencoded } from 'express';
import helmet, { HelmetOptions } from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import rawSwaggerFile from '../swagger-output.json';
import { AppModule } from './app.module';
import { env } from './config/env';
import { logger } from './utils/logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const helmetOptions: HelmetOptions = {
    contentSecurityPolicy: false,
  };

  app.use(helmet(helmetOptions));
  app.enableCors();
  app.use(json());
  app.use(urlencoded({ extended: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useStaticAssets(path.join(process.cwd(), 'public'), { prefix: '/public/' });

  const swaggerFile = {
    ...rawSwaggerFile,
    host:
      env.nodeEnv === 'production'
        ? 'sparatafinalapp.up.railway.app'
        : `localhost:${env.port}`,
    schemes: env.nodeEnv === 'production' ? ['https'] : ['http'],
  };

  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'list',
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile, swaggerOptions));

  await app.listen(env.port);
  logger.info('Server listening', { port: env.port, env: env.nodeEnv });
}

bootstrap();
