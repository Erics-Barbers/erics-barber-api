import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { GetBookingsUseCase } from '../application/use-cases/get-bookings.use-case';
import { GetBookingDetailsUseCase } from '../application/use-cases/get-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from '../application/use-cases/update-booking.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-booking.dto';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly getBookingsUseCase: GetBookingsUseCase,
    private readonly getBookingDetailsUseCase: GetBookingDetailsUseCase,
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly updateBookingUseCase: UpdateBookingUseCase,
  ) {}

  @Get('')
  async getBookings(@Query() query: GetBookingsQueryDto) {
    await this.getBookingsUseCase.execute(query);
  }

  @Get(':id')
  async getBookingDetails(@Param('id') id: string) {
    await this.getBookingDetailsUseCase.execute(id);
  }

  @Post('')
  async createBooking(dto: CreateBookingDto) {
    await this.createBookingUseCase.execute(dto);
  }

  @Patch(':id')
  async updateBooking(@Param('id') id: string, dto: UpdateBookingDto) {
    await this.updateBookingUseCase.execute(id, dto);
  }
}
