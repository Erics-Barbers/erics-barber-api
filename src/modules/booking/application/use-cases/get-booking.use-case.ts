import { Injectable } from '@nestjs/common';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class GetBookingDetailsUseCase {
  constructor(readonly bookingService: BookingService) {}

  async execute(bookingId: string) {
    return await this.bookingService.getBookingDetails(bookingId);
  }
}
