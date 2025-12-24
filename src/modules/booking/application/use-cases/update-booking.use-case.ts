import { Injectable } from '@nestjs/common';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class UpdateBookingUseCase {
    constructor(
        private readonly bookingService: BookingService,
    ) {}
  async execute(bookingId: string, dto: UpdateBookingDto) {
    return await this.bookingService.updateBooking(bookingId, dto);
  }
}
