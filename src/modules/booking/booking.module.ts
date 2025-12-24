import { Module } from '@nestjs/common';
import { BookingController } from './presentation/booking.controller';

@Module({
  controllers: [BookingController],
})
export class BookingModule {}
