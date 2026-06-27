import { Injectable } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';
import { AvailabilityService } from 'src/modules/availability/infrastructure/availability.service';
import { BookingStatus } from 'src/generated/prisma/enums';

const BOOKING_SLOT_MINUTES = 30;

@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly resendService: ResendService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async createBooking(dto: CreateBookingDto) {
    // Check new booking time is not in the past
    if (dto.appointmentDate < new Date()) {
      throw new Error('Cannot create booking in the past');
    }

    await this.availabilityService.assertSlotAvailable({
      barberId: dto.barberId,
      serviceId: dto.serviceId,
      startTime: dto.appointmentDate,
    });

    const appointmentEndTime = new Date(
      dto.appointmentDate.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
    );

    await this.prismaService.booking.create({
      data: {
        userId: dto.userId,
        serviceId: dto.serviceId,
        barberId: dto.barberId,
        status: BookingStatus.CONFIRMED,
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

    const barberId = dto.barberId ?? booking.barberId;
    const serviceId = dto.serviceId ?? booking.serviceId;

    if (!barberId) {
      throw new Error('Barber not found');
    }

    if (!serviceId) {
      throw new Error('Service not found');
    }

    const appointmentStartTime = dto.appointmentDate ?? booking.startTime;
    const appointmentEndTime =
      dto.appointmentDate || dto.serviceId
        ? new Date(
            appointmentStartTime.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
          )
        : undefined;

    // Check booking time is available
    if (dto.appointmentDate || dto.serviceId || dto.barberId) {
      await this.availabilityService.assertSlotAvailable({
        barberId,
        serviceId,
        startTime: appointmentStartTime,
        excludeBookingId: bookingId,
      });
    }

    // Update booking details
    await this.prismaService.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        serviceId: dto.serviceId,
        barberId: dto.barberId,
        status: dto.status,
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
