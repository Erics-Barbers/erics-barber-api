import { Module } from '@nestjs/common';
import { BookingController } from './presentation/booking.controller';
import { TokenService } from '../auth/infrastructure/services/jwt.service';
import { BookingService } from './infrastructure/prisma/booking.prisma-repository';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { GetBookingDetailsUseCase } from './application/use-cases/get-booking.use-case';
import { GetBookingsUseCase } from './application/use-cases/get-bookings.use-case';
import { UpdateBookingUseCase } from './application/use-cases/update-booking.use-case';
import { CreateBookingUseCase } from './application/use-cases/create-booking.use-case';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { BookingGuard } from 'src/common/guards/booking.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { AvailabilityModule } from '../availability/availability.module';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';

@Module({
  imports: [PrismaModule, AvailabilityModule],
  controllers: [BookingController],
  providers: [
    // Services
    BookingService,
    PrismaService,
    TokenService,
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
    BookingGuard,
    // Use Cases
    GetBookingDetailsUseCase,
    GetBookingsUseCase,
    UpdateBookingUseCase,
    CreateBookingUseCase,
  ],
  exports: [BookingService],
})
export class BookingModule {}
