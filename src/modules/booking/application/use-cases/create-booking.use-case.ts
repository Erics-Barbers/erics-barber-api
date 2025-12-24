import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class CreateBookingUseCase {
  constructor(private readonly bookingService: BookingService) {}
  async execute(dto: CreateBookingDto) {
    return await this.bookingService.createBooking(dto);
  }
}
