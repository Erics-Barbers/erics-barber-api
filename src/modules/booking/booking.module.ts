import { Module } from '@nestjs/common';
import { BookingController } from './presentation/booking.controller';
import { TokenService } from '../auth/infrastructure/services/jwt.service';
import { BookingService } from './infrastructure/prisma/booking.prisma-repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetBookingDetailsUseCase } from './application/use-cases/get-booking.use-case';
import { GetBookingsUseCase } from './application/use-cases/get-bookings.use-case';
import { UpdateBookingUseCase } from './application/use-cases/update-booking.use-case';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [BookingController],
  providers: [
    // Services
    BookingService,
    PrismaService,
    ResendService,
    TokenService,
    // Use Cases
    GetBookingDetailsUseCase,
    GetBookingsUseCase,
    UpdateBookingUseCase,
    CreateBookingUseCase,
  ],
})
export class BookingModule {}
