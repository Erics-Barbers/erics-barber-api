import { Module } from '@nestjs/common';
import { BarbersController } from './presentation/barbers.controller';
import { BarbersService } from './infrastructure/prisma/barbers.prisma-repository';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetBarberUseCase } from './application/use-cases/get-barber.use-case';
import { GetBarbersUseCase } from './application/use-cases/get-barbers.use-case';
import { CreateBarberUseCase } from './application/use-cases/create-barber.use-case';
import { UpdateBarberUseCase } from './application/use-cases/update-barber.use-case';
import { DeleteBarberUseCase } from './application/use-cases/delete-barber.use-case';
import { AuthService } from '../auth/infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../auth/infrastructure/services/bcrypt.service';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { TokenService } from '../auth/infrastructure/services/jwt.service';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [BarbersController],
  providers: [
    AuthService,
    BcryptService,
    ResendService,
    TokenService,
    AuthGuard,
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
