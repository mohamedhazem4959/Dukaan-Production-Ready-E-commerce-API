import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './transform.interceptor';
import cookieParser from 'cookie-parser';
import { VersioningType } from '@nestjs/common';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';

const server = express();
let isInitialized = false;

const swaggerCustomOptions = {
  customCssUrl: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.css',
  ],
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.18.2/swagger-ui-standalone-preset.min.js',
  ],
  customSiteTitle: 'Dukaan E-Commerce API Docs',
};

export async function bootstrapServer() {
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
  SwaggerModule.setup('/api/v1/docs', app, document, swaggerCustomOptions);

  await app.init();
  isInitialized = true;
  return server;
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!isInitialized) {
      await bootstrapServer();
    }
    server(req, res);
  } catch (error: any) {
    console.error('Serverless execution error:', error);
    res.status(500).json({
      statusCode: 500,
      error: 'FUNCTION_INVOCATION_FAILED',
      message: error?.message || 'Serverless execution error',
    });
  }
}

if (!process.env.VERCEL) {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
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
    SwaggerModule.setup('/api/v1/docs', app, document, swaggerCustomOptions);

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`Application running locally on http://localhost:${port}`);
  }
  bootstrapLocal();
}
