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
    const service = await this.prismaService.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Check new booking time is not in the past
    if (dto.appointmentDate < new Date()) {
      throw new Error('Cannot create booking in the past');
    }

    const appointmentEndTime = new Date(
      dto.appointmentDate.getTime() + service.durationMinutes * 60 * 1000,
    );

    // Check booking time is available
    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        startTime: { lt: appointmentEndTime },
        endTime: { gt: dto.appointmentDate },
      },
    });

    if (existingBooking) {
      throw new Error('Booking time is not available');
    }

    await this.prismaService.booking.create({
      data: {
        userId: dto.userId,
        serviceId: service.id,
        startTime: dto.appointmentDate,
        endTime: appointmentEndTime,
      },
    });

    await this.resendService.sendEmail(
      '',
      'Booking Confirmation',
      `<p>Your booking for ${dto.appointmentDate.toISOString()} has been confirmed.</p>`,
    );
  }

  async updateBooking(bookingId: string, dto: UpdateBookingDto) {
    // Check if booking exists
    const booking = await this.prismaService.booking.findUnique({
      where: { id: bookingId },
      include: { service: true },
    });
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check new booking time is not in the past
    if (dto.appointmentDate && dto.appointmentDate < new Date()) {
      throw new Error('Cannot update booking to a past date');
    }

    const serviceId = dto.serviceId ?? booking.serviceId;
    const service = serviceId
      ? await this.prismaService.service.findFirst({
          where: { id: serviceId, isActive: true },
        })
      : null;

    if (dto.serviceId && !service) {
      throw new Error('Service not found');
    }

    const appointmentStartTime = dto.appointmentDate ?? booking.startTime;
    const appointmentEndTime = service
      ? new Date(
          appointmentStartTime.getTime() + service.durationMinutes * 60 * 1000,
        )
      : dto.appointmentDate
        ? booking.endTime
        : undefined;

    // Check booking time is available
    if (dto.appointmentDate || dto.serviceId) {
      const existingBooking = await this.prismaService.booking.findFirst({
        where: {
          startTime: { lt: appointmentEndTime ?? booking.endTime },
          endTime: { gt: appointmentStartTime },
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
        serviceId: dto.serviceId,
        startTime: dto.appointmentDate,
        endTime: appointmentEndTime,
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
      include: { service: true },
    });
  }

  async getBookings(query: GetBookingsQueryDto) {
    // Check userId matches logged in user

    const userBookings = await this.prismaService.booking.findMany({
      where: {
        userId: query.userId,
      },
      include: { service: true },
      orderBy: { startTime: 'asc' },
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
