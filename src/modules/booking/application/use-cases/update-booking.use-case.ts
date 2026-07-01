import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { BookingService } from '../../infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class UpdateBookingUseCase {
  constructor(private readonly bookingService: BookingService) {}
  async execute(
    bookingId: string,
    userId: string,
    role: Role,
    dto: UpdateBookingDto,
  ) {
    return await this.bookingService.updateBooking(
      bookingId,
      userId,
      role,
      dto,
    );
  }

  async cancel(bookingId: string, userId: string, role: Role) {
    return await this.bookingService.cancelBooking(bookingId, userId, role);
  }

  async guestUpdate(reference: string, dto: UpdateBookingDto) {
    return await this.bookingService.updateGuestBookingByReference(
      reference,
      dto,
    );
  }

  async guestCancel(reference: string) {
    return await this.bookingService.cancelGuestBookingByReference(reference);
  }
}
