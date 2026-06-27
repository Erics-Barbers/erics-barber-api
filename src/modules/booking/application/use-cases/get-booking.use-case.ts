import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class GetBookingDetailsUseCase {
  constructor(readonly bookingService: BookingService) {}

  async execute(bookingId: string, userId: string, role: Role) {
    return await this.bookingService.getBookingDetails(bookingId, userId, role);
  }
}
