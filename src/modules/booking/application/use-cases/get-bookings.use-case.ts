import { Injectable } from '@nestjs/common';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';
import { Role } from 'src/common/constants/role.enum';

@Injectable()
export class GetBookingsUseCase {
  constructor(private readonly bookingService: BookingService) {}
  async execute(userId: string, role: Role, query: GetBookingsQueryDto) {
    return await this.bookingService.getBookings(userId, role, query);
  }
}
