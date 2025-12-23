import { Injectable } from '@nestjs/common';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';

@Injectable()
export class UpdateBookingUseCase {
  async execute(bookingId: string, dto: UpdateBookingDto) {}
}
