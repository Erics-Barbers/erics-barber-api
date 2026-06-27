import { Injectable } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';

const BOOKING_SLOT_MINUTES = 30;

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

    if (service.durationMinutes !== BOOKING_SLOT_MINUTES) {
      throw new Error('Service duration must be 30 minutes');
    }

    const barber = await this.prismaService.barber.findFirst({
      where: { id: dto.barberId, isActive: true },
    });

    if (!barber) {
      throw new Error('Barber not found');
    }

    // Check new booking time is not in the past
    if (dto.appointmentDate < new Date()) {
      throw new Error('Cannot create booking in the past');
    }

    if (!this.isHalfHourAligned(dto.appointmentDate)) {
      throw new Error('Booking start time must be on the hour or half hour');
    }

    const appointmentEndTime = new Date(
      dto.appointmentDate.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
    );

    // Check booking time is available
    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        barberId: barber.id,
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
        barberId: barber.id,
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

    if (service && service.durationMinutes !== BOOKING_SLOT_MINUTES) {
      throw new Error('Service duration must be 30 minutes');
    }

    const barberId = dto.barberId ?? booking.barberId;
    const barber = barberId
      ? await this.prismaService.barber.findFirst({
          where: { id: barberId, isActive: true },
        })
      : null;

    if (!barber) {
      throw new Error('Barber not found');
    }

    const appointmentStartTime = dto.appointmentDate ?? booking.startTime;

    if (!this.isHalfHourAligned(appointmentStartTime)) {
      throw new Error('Booking start time must be on the hour or half hour');
    }

    const appointmentEndTime =
      dto.appointmentDate || dto.serviceId
        ? new Date(
            appointmentStartTime.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
          )
        : undefined;

    // Check booking time is available
    if (dto.appointmentDate || dto.serviceId || dto.barberId) {
      const existingBooking = await this.prismaService.booking.findFirst({
        where: {
          barberId: barber.id,
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
        barberId: dto.barberId,
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

  private isHalfHourAligned(date: Date) {
    return (
      (date.getUTCMinutes() === 0 || date.getUTCMinutes() === 30) &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    );
  }
}
