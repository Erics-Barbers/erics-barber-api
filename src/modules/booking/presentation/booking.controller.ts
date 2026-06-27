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
import { BookingGuard } from 'src/common/guards/booking.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CurrentUser,
  CurrentUserRole,
} from 'src/common/decorators/current-user.decorator';

@UseGuards(AuthGuard, RolesGuard, BookingGuard)
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
  async getBookings(
    @CurrentUser() userId: string,
    @Query() query: GetBookingsQueryDto,
  ) {
    const bookings = await this.getBookingsUseCase.execute(userId, query);
    return bookings;
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Customer, Role.Barber)
  async getBookingDetails(
    @CurrentUser() userId: string,
    @CurrentUserRole() role: Role,
    @Param('id') bookingId: string,
  ) {
    const bookingDetails = await this.getBookingDetailsUseCase.execute(
      bookingId,
      userId,
      role,
    );
    return bookingDetails;
  }

  @Post('')
  @Roles(Role.Admin, Role.Customer)
  async createBooking(
    @CurrentUser() userId: string,
    @Body() dto: CreateBookingDto,
  ) {
    const booking = await this.createBookingUseCase.execute(userId, dto);
    return { message: 'Booking created successfully', booking };
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Customer)
  async updateBooking(
    @CurrentUser() userId: string,
    @CurrentUserRole() role: Role,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    await this.updateBookingUseCase.execute(id, userId, role, dto);
    return { message: 'Booking updated successfully' };
  }

  @Patch(':id/cancel')
  @Roles(Role.Admin, Role.Customer)
  async cancelBooking(
    @CurrentUser() userId: string,
    @CurrentUserRole() role: Role,
    @Param('id') id: string,
  ) {
    await this.updateBookingUseCase.cancel(id, userId, role);
    return { message: 'Booking cancelled successfully' };
  }
}
