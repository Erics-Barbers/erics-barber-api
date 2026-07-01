import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { GetBookingsUseCase } from '../application/use-cases/get-bookings.use-case';
import { GetBookingDetailsUseCase } from '../application/use-cases/get-booking.use-case';
import { CreateBookingUseCase } from '../application/use-cases/create-booking.use-case';
import { UpdateBookingUseCase } from '../application/use-cases/update-booking.use-case';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-booking.dto';
import { BookingReferenceDto } from './dto/booking-reference.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/constants/role.enum';
import { BookingGuard } from 'src/common/guards/booking.guard';
import { OptionalAuthGuard } from 'src/common/guards/optional-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  CurrentUser,
  CurrentUserOptional,
  CurrentUserRole,
} from 'src/common/decorators/current-user.decorator';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly getBookingsUseCase: GetBookingsUseCase,
    private readonly getBookingDetailsUseCase: GetBookingDetailsUseCase,
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly updateBookingUseCase: UpdateBookingUseCase,
  ) {}

  @Get('')
  @UseGuards(AuthGuard, RolesGuard, BookingGuard)
  @Roles(Role.Admin, Role.Customer)
  async getBookings(
    @CurrentUser() userId: string,
    @Query() query: GetBookingsQueryDto,
  ) {
    const bookings = await this.getBookingsUseCase.execute(userId, query);
    return bookings;
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard, BookingGuard)
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
  @UseGuards(BookingGuard, OptionalAuthGuard)
  async createBooking(
    @CurrentUserOptional() userId: string | undefined,
    @Body() dto: CreateBookingDto,
  ) {
    const booking = await this.createBookingUseCase.execute(userId, dto);
    return { message: 'Booking created successfully', booking };
  }

  @Post('reference/lookup')
  @UseGuards(BookingGuard)
  async getBookingByReference(@Body() dto: BookingReferenceDto) {
    const booking = await this.getBookingDetailsUseCase.byReference(
      dto.reference,
    );
    return { booking };
  }

  @Patch('reference/:reference')
  @UseGuards(BookingGuard)
  async updateBookingByReference(
    @Param('reference', new ParseUUIDPipe({ version: '4' })) reference: string,
    @Body() dto: UpdateBookingDto,
  ) {
    const booking = await this.updateBookingUseCase.guestUpdate(reference, dto);
    return { message: 'Booking updated successfully', booking };
  }

  @Patch('reference/:reference/cancel')
  @UseGuards(BookingGuard)
  async cancelBookingByReference(
    @Param('reference', new ParseUUIDPipe({ version: '4' })) reference: string,
  ) {
    const booking = await this.updateBookingUseCase.guestCancel(reference);
    return { message: 'Booking cancelled successfully', booking };
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard, BookingGuard)
  @Roles(Role.Admin, Role.Customer)
  async updateBooking(
    @CurrentUser() userId: string,
    @CurrentUserRole() role: Role,
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    const booking = await this.updateBookingUseCase.execute(
      id,
      userId,
      role,
      dto,
    );
    return { message: 'Booking updated successfully', booking };
  }

  @Patch(':id/cancel')
  @UseGuards(AuthGuard, RolesGuard, BookingGuard)
  @Roles(Role.Admin, Role.Customer)
  async cancelBooking(
    @CurrentUser() userId: string,
    @CurrentUserRole() role: Role,
    @Param('id') id: string,
  ) {
    const booking = await this.updateBookingUseCase.cancel(id, userId, role);
    return { message: 'Booking cancelled successfully', booking };
  }
}
