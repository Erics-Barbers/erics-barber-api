import { Injectable } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';

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

  async updateBooking(dto: UpdateBookingDto) {
    await this.prismaService.booking.update({
      where: {
        id: '',
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

  async getBookingDetails(bookingId: string) {}

  async getBookings() {}
}
