import { Module } from '@nestjs/common';
import { BarbersController } from './presentation/barbers.controller';
import { BarbersService } from './infrastructure/prisma/barbers.prisma-repository';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetBarberUseCase } from './application/use-cases/get-barber.use-case';
import { GetBarbersUseCase } from './application/use-cases/get-barbers.use-case';
import { CreateBarberUseCase } from './application/use-cases/create-barber.use-case';
import { UpdateBarberUseCase } from './application/use-cases/update-barber.use-case';
import { DeleteBarberUseCase } from './application/use-cases/delete-barber.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [BarbersController],
  providers: [
    BarbersService,
    GetBarberUseCase,
    GetBarbersUseCase,
    CreateBarberUseCase,
    UpdateBarberUseCase,
    DeleteBarberUseCase,
  ],
  exports: [BarbersService],
})
export class BarbersModule {}
