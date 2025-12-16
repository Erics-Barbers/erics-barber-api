// Module
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

// Controller
import { AuthController } from './presentation/controllers/auth.controller';

// Providers
import { AuthService } from './infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { EnableMfaUseCase } from './application/use-cases/enable-mfa.use-case';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { TokenService } from './infrastructure/services/jwt-token.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    BcryptService,
    EnableMfaUseCase,
    RegisterUseCase,
    LoginUseCase,
    LogoutUseCase,
    ResetPasswordUseCase,
    TokenService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
