import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule);

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle("Eric's Barber API")
    .setDescription('Auth and Booking API for Barber Shop Application')
    .setVersion('1.0')
    .build();
  config.servers = [
    {
      url: 'https://erics-barber-api.onrender.com',
      description: 'Base URL for API',
    },
  ];
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Global Middlewares and Pipes
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  // Start the application
  await app.listen(4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
