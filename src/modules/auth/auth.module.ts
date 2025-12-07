import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthController } from './presentation/controllers/auth.controller';

// Application
import { AuthService } from '../auth/infrastructure/prisma/auth/auth.repository';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterUseCase,
    LoginUseCase,
  ],
  exports: [AuthService],
})
export class AuthModule {}
