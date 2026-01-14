import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule);

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle("Eric's Barber API")
    .setDescription('Auth and Booking API for Barber Shop Application')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  // Global Middlewares and Pipes
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  // Start the application
  await app.listen(4000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
