import { Injectable } from '@nestjs/common';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class GetBookingsUseCase {
  constructor(private readonly bookingService: BookingService) {}
  async execute(userId: string, query: GetBookingsQueryDto) {
    return await this.bookingService.getBookings(userId, query);
  }
}
