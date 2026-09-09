import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from '../src/transform.interceptor';
import cookieParser from 'cookie-parser';
import { VersioningType } from '@nestjs/common';
import { RequestLoggingInterceptor } from '../src/common/interceptors/request-logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

const server = express();
let isAppInitialized = false;

async function bootstrap() {
  const adapter = new ExpressAdapter(server);
  const app = await NestFactory.create(AppModule, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    app.get(RequestLoggingInterceptor),
  );

  app.enableCors({
    origin: configService.get<string>(
      'FRONTEND_ORIGIN',
      'http://localhost:3000',
    ),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('Swagger Documentation For E-Commerce APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/v1/docs', app, document);

  await app.init();
  isAppInitialized = true;
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!isAppInitialized) {
      await bootstrap();
    }
    server(req, res);
  } catch (error: any) {
    console.error('CRITICAL: Serverless bootstrap failed:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'FUNCTION_INVOCATION_FAILED',
      message: error?.message || 'Serverless bootstrap error',
      details: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
    });
  }
}
