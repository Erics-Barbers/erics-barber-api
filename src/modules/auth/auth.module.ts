// Module
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

// Controller
import { AuthController } from './presentation/controllers/auth.controller';

// Providers
import { AuthService } from './infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from './infrastructure/services/bcrypt.service';
import { TokenService } from './infrastructure/services/jwt.service';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { EnableMfaUseCase } from './application/use-cases/enable-mfa.use-case';
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ResetPasswordEmailUseCase } from './application/use-cases/reset-password-email.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    // Services
    AuthService,
    BcryptService,
    ResendService,
    TokenService,
    // Use Cases
    RegisterUseCase,
    LoginUseCase,
    VerifyEmailUseCase,
    LogoutUseCase,
    ResetPasswordUseCase,
    ResetPasswordEmailUseCase,
    EnableMfaUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
