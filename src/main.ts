import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import cookieParser = require('cookie-parser');
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { globalValidationPipeOptions } from './config/validation';

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule);

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle("Eric's Barber API")
    .setDescription('Auth and Booking API for Barber Shop Application')
    .setContact(
      'Fahmid Haque',
      'https://www.linkedin.com/in/fahmid-h-b7a96b123/',
      'fahmidulhaque97@pm.me',
    )
    .setLicense('MIT', 'https://mit-license.org/')
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
  const corsOptions: CorsOptions = {
    origin: process.env.CLIENT_BASE_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(helmet());
  app.enableCors(corsOptions);
  app.useGlobalPipes(new ValidationPipe(globalValidationPipeOptions));
  app.use(cookieParser());

  // Start the application
  await app.listen(4000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
