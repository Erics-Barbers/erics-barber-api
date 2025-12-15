import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { BookingModule } from './modules/booking/booking.module';
import { AuthController } from './modules/auth/presentation/controllers/auth.controller';
import { UsersService } from './modules/users/users.service';
import { UsersController } from './modules/users/users.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { NotificationsService } from './modules/notifications/notifications.service';
import { NotificationsController } from './modules/notifications/notifications.controller';
import { TokenService } from './modules/auth/infrastructure/services/jwt-token.service';
import { BcryptService } from './modules/auth/infrastructure/services/bcrypt.service';
import { RefreshTokenService } from './modules/auth/infrastructure/strategies/refresh-token/refresh-token.service';
import { LocalService } from './modules/auth/infrastructure/strategies/local/local.service';
import { JwtService } from './modules/auth/infrastructure/strategies/jwt/jwt.service';
import { MfaService } from './modules/auth/infrastructure/prisma/mfa.service';
import { AuthService } from './modules/auth/infrastructure/prisma/auth.repository';

@Module({
  imports: [ConfigModule, BookingModule],
  controllers: [
    AppController,
    AuthController,
    NotificationsController,
    PaymentsController,
    UsersController,
  ],
  providers: [
    AppService,
    AuthService,
    RefreshTokenService,
    MfaService,
    JwtService,
    LocalService,
    BcryptService,
    TokenService,
    NotificationsService,
    PaymentsService,
    UsersService,
  ],
})
export class AppModule {}
