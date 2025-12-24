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
    return await this.prismaService.booking.findUnique({
      where: {
        id: bookingId,
      },
    });
  }

  async getBookings(query: GetBookingsQueryDto) {
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
