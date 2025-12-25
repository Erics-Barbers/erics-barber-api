import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetBookingsUseCase } from '../application/use-cases/get-bookings.use-case';
import { GetBookingDetailsUseCase } from '../application/use-cases/get-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from '../application/use-cases/update-booking.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-booking.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constants/role.enum';

@UseGuards(AuthGuard)
@Controller('booking')
export class BookingController {
  constructor(
    private readonly getBookingsUseCase: GetBookingsUseCase,
    private readonly getBookingDetailsUseCase: GetBookingDetailsUseCase,
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly updateBookingUseCase: UpdateBookingUseCase,
  ) {}

  @Get('')
  @Roles(Role.Admin, Role.Customer)
  async getBookings(@Query() query: GetBookingsQueryDto) {
    const bookings = await this.getBookingsUseCase.execute(query);
    return bookings;
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Barber)
  async getBookingDetails(@Param('id') bookingId: string) {
    const bookingDetails = await this.getBookingDetailsUseCase.execute(bookingId);
    return bookingDetails;
  }

  @Post('')
  @Roles(Role.Admin, Role.Customer)
  async createBooking(@Body() dto: CreateBookingDto) {
    await this.createBookingUseCase.execute(dto);
    return { message: 'Booking created successfully' };
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Customer)
  async updateBooking(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    await this.updateBookingUseCase.execute(id, dto);
    return { message: 'Booking updated successfully' };
  }
}
