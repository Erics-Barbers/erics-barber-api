import { Injectable } from '@nestjs/common';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';

@Injectable()
export class CreateBookingUseCase {
  async execute(dto: CreateBookingDto) {}
}
