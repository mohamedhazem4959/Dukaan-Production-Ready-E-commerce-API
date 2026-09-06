import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './transform.interceptor';
import cookieParser from 'cookie-parser';
import { VersioningType } from '@nestjs/common';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(new ZodValidationPipe());

  app.useGlobalInterceptors(new TransformInterceptor(), app.get(RequestLoggingInterceptor));

  app.enableCors({
  origin: configService.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000'),
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
    .setDescription('Swagger Documentaion For E-Commerce APIs')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('/api/v1/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
