import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { ConfigModule } from './config/config.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarbersModule } from './modules/barbers/barbers.module';
import { HealthModule } from './modules/health/health.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AuthModule,
    BarbersModule,
    BookingModule,
    ConfigModule,
    HealthModule,
    PaymentsModule,
    NotificationsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
