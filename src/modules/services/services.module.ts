import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetServicesUseCase } from './application/use-cases/get-services.use-case';
import { ServicesRepository } from './infrastructure/prisma/services.prisma-repository';
import { ServicesController } from './presentation/services.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [ServicesRepository, GetServicesUseCase],
  exports: [ServicesRepository],
})
export class ServicesModule {}
