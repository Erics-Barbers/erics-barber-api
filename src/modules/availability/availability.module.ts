import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetAvailabilitySlotsUseCase } from './application/use-cases/get-availability-slots.use-case';
import { AvailabilityService } from './infrastructure/availability.service';
import { AvailabilityController } from './presentation/availability.controller';
import { BarberAvailabilityController } from './presentation/barber-availability.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AvailabilityController, BarberAvailabilityController],
  providers: [AvailabilityService, GetAvailabilitySlotsUseCase],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
