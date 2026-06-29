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
import { GetProfileUseCase } from './application/use-cases/get-profile.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ResetPasswordEmailUseCase } from './application/use-cases/reset-password-email.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { SendVerificationEmailUseCase } from './application/use-cases/send-verification-email.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { UnverifiedUserCleanupService } from './application/services/unverified-user-cleanup.service';
import { VerifyMfaUseCase } from './application/use-cases/verify-mfa.use-case';
import { UpdateMfaPreferenceUseCase } from './application/use-cases/update-mfa-preference.use-case';
import { ExpiredAuthStateCleanupService } from './application/services/expired-auth-state-cleanup.service';
import { DeleteAccountUseCase } from './application/use-cases/delete-account.use-case';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AccountLookupUseCase } from './application/use-cases/account-lookup.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [
    // Services
    AuthService,
    BcryptService,
    ResendService,
    TokenService,
    AuthGuard,
    // Use Cases
    RegisterUseCase,
    LoginUseCase,
    VerifyEmailUseCase,
    LogoutUseCase,
    ResetPasswordUseCase,
    ResetPasswordEmailUseCase,
    VerifyMfaUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    SendVerificationEmailUseCase,
    AccountLookupUseCase,
    RefreshTokenUseCase,
    UpdateMfaPreferenceUseCase,
    DeleteAccountUseCase,
    UnverifiedUserCleanupService,
    ExpiredAuthStateCleanupService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
