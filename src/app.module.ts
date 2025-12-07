import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { BookingModule } from './booking/booking.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { LoginService } from './auth/application/login/login.service';
import { RegisterService } from './auth/application/register/register.service';
import { RefreshTokenService } from './auth/application/refresh-token/refresh-token.service';
import { LogoutService } from './auth/application/logout/logout.service';
import { EnableMfaService } from './auth/application/mfa/enable-mfa/enable-mfa.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { UsersService } from './users/users.service';
import { UsersController } from './users/users.controller';
import { PaymentsService } from './payments/payments.service';
import { PaymentsController } from './payments/payments.controller';
import { NotificationsService } from './notifications/notifications.service';
import { NotificationsController } from './notifications/notifications.controller';
import { TokenService } from './auth/infrastructure/services/token/token.service';
import { BcryptService } from './auth/infrastructure/services/bcrypt/bcrypt.service';
import { RefreshTokenService } from './auth/infrastructure/strategies/refresh-token/refresh-token.service';
import { LocalService } from './auth/infrastructure/strategies/local/local.service';
import { JwtService } from './auth/infrastructure/strategies/jwt/jwt.service';
import { MfaService } from './auth/infrastructure/prisma/mfa/mfa.service';
import { AuthService } from './auth/infrastructure/prisma/auth/auth.repository';
import { MfaService } from './auth/infrastructure/prisma/mfa/mfa.service';
import { AuthService } from './auth/infrastructure/prisma/auth/auth.repository';
import { EnableMfaService } from './auth/application/mfa/enable-mfa/enable-mfa.service';

@Module({
  imports: [ConfigModule, BookingModule, PrismaModule],
  controllers: [AppController, AuthController, NotificationsController, PaymentsController, UsersController],
  providers: [AppService, AuthService, LoginService, RegisterService, RefreshTokenService, LogoutService, EnableMfaService, MfaService, JwtService, LocalService, BcryptService, TokenService, NotificationsService, PaymentsService, UsersService],
})
export class AppModule {}
