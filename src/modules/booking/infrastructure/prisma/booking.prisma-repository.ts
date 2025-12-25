import { Injectable } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    // Check new booking time is not in the past
    if (dto.appointmentDate < new Date()) {
      throw new Error('Cannot create booking in the past');
    }

    // Check booking time is available
    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        startTime: dto.appointmentDate,
      },
    });

    if (existingBooking) {
      throw new Error('Booking time is not available');
    }

    await this.prismaService.booking.create({
      data: {
        userId: dto.userId,
        startTime: dto.appointmentDate,
        endTime: new Date(dto.appointmentDate.getTime() + 60 * 60 * 1000),
      },
    });

    await this.resendService.sendEmail(
      '',
      'Booking Confirmation',
      `<p>Your booking for ${dto.appointmentDate} has been confirmed.</p>`,
    );
  }

  async updateBooking(bookingId: string, dto: UpdateBookingDto) {
    // Check if booking exists
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check new booking time is not in the past
    if (dto.appointmentDate && dto.appointmentDate < new Date()) {
      throw new Error('Cannot update booking to a past date');
    }

    // Check booking time is available
    if (dto.appointmentDate) {
      const existingBooking = await this.prismaService.booking.findFirst({
        where: {
          startTime: dto.appointmentDate,
          NOT: { id: bookingId },
        },
      });

      if (existingBooking) {
        throw new Error('Booking time is not available');
      }
    }

    // Update booking details
    await this.prismaService.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        startTime: dto.appointmentDate,
        endTime: dto.appointmentDate
          ? new Date(dto.appointmentDate.getTime() + 60 * 60 * 1000)
          : undefined,
      },
    });

    await this.resendService.sendEmail(
      '',
      'Booking Updated',
      `<p>Your booking has been updated.</p>`,
    );
  }

  async getBookingDetails(bookingId: string) {
    // Determine if requester is allowed to access this booking
    // Customer or Barber can only access their own bookings



    return await this.prismaService.booking.findUnique({
      where: {
        id: bookingId,
      },
    });
  }

  async getBookings(query: GetBookingsQueryDto) {
    // Check userId matches logged in user


    const userBookings = await this.prismaService.booking.findMany({
      where: {
        userId: query.userId,
      },
    });

    if (query.page) {
      const page = query.page;
      const limit = query.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      return userBookings.slice(startIndex, endIndex);
    }
    return userBookings;
  }
}
