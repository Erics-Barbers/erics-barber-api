import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { BookingModule } from './modules/booking/booking.module';
import { ConfigModule } from './config/config.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarbersModule } from './modules/barbers/barbers.module';
import { HealthModule } from './modules/health/health.module';
import { ServicesModule } from './modules/services/services.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxModule } from './infrastructure/outbox/outbox.module';

@Module({
  imports: [
    AuthModule,
    BarbersModule,
    AvailabilityModule,
    BookingModule,
    ConfigModule,
    HealthModule,
    ServicesModule,
    PaymentsModule,
    NotificationsModule,
    OutboxModule,
    ScheduleModule.forRoot(),
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
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
