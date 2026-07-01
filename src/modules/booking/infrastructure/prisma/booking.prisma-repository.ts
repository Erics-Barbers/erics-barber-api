import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
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

  async createBooking(userId: string | undefined, dto: CreateBookingDto) {
    // Check new booking time is not in the past
    if (dto.appointmentDate < new Date()) {
      throw new BadRequestException('Cannot create booking in the past');
    }

    await this.availabilityService.assertSlotAvailable({
      barberId: dto.barberId,
      serviceId: dto.serviceId,
      startTime: dto.appointmentDate,
    });

    const appointmentEndTime = new Date(
      dto.appointmentDate.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
    );

    const user = userId
      ? await this.prismaService.user.findUnique({
          where: { id: userId },
          select: { email: true, name: true },
        })
      : null;

    if (userId && !user) {
      throw new NotFoundException('User not found');
    }

    const customerName = dto.customerName?.trim() || user?.name;
    const customerEmail = dto.customerEmail?.trim() || user?.email;
    const customerPhone = dto.customerPhone?.trim();

    if (!customerName || !customerEmail || (!userId && !customerPhone)) {
      throw new BadRequestException(
        'Customer name, email, and phone are required for guest bookings',
      );
    }

    const booking = await this.prismaService.booking.create({
      data: {
        userId,
        customerName,
        customerEmail,
        customerPhone,
        serviceId: dto.serviceId,
        barberId: dto.barberId,
        status: BookingStatus.CONFIRMED,
        startTime: dto.appointmentDate,
        endTime: appointmentEndTime,
      },
      include: {
        service: true,
        barber: true,
      },
    });

    await this.resendService.sendEmail(
      customerEmail,
      'Booking Confirmation',
      `<p>Your booking for ${dto.appointmentDate.toISOString()} has been confirmed.</p><p>Booking reference: <strong>${booking.id}</strong></p>`,
    );

    return booking;
  }

  async updateBooking(
    bookingId: string,
    userId: string,
    role: Role,
    dto: UpdateBookingDto,
  ) {
    const booking = await this.prismaService.booking.findFirst({
      where: await this.getBookingAccessWhere(bookingId, userId, role),
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot be updated');
    }

    // Check new booking time is not in the past
    if (dto.appointmentDate && dto.appointmentDate < new Date()) {
      throw new BadRequestException('Cannot update booking to a past date');
    }

    const barberId = dto.barberId ?? booking.barberId;
    const serviceId = dto.serviceId ?? booking.serviceId;

    if (!barberId) {
      throw new NotFoundException('Barber not found');
    }

    if (!serviceId) {
      throw new NotFoundException('Service not found');
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
    const updatedBooking = await this.prismaService.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        serviceId: dto.serviceId,
        barberId: dto.barberId,
        startTime: dto.appointmentDate,
        endTime: appointmentEndTime,
      },
      include: {
        service: true,
        barber: true,
      },
    });

    if (booking.customerEmail) {
      await this.resendService.sendEmail(
        booking.customerEmail,
        'Booking Updated',
        `<p>Your booking has been updated.</p>`,
      );
    }

    return updatedBooking;
  }

  async getGuestBookingByReference(reference: string) {
    const booking = await this.prismaService.booking.findFirst({
      where: this.getGuestBookingReferenceWhere(reference),
      include: { service: true, barber: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateGuestBookingByReference(
    reference: string,
    dto: UpdateBookingDto,
  ) {
    const booking = await this.prismaService.booking.findFirst({
      where: this.getGuestBookingReferenceWhere(reference),
      include: { service: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cancelled bookings cannot be updated');
    }

    if (dto.appointmentDate && dto.appointmentDate < new Date()) {
      throw new BadRequestException('Cannot update booking to a past date');
    }

    const barberId = dto.barberId ?? booking.barberId;
    const serviceId = dto.serviceId ?? booking.serviceId;

    if (!barberId) {
      throw new NotFoundException('Barber not found');
    }

    if (!serviceId) {
      throw new NotFoundException('Service not found');
    }

    const appointmentStartTime = dto.appointmentDate ?? booking.startTime;
    const appointmentEndTime =
      dto.appointmentDate || dto.serviceId
        ? new Date(
            appointmentStartTime.getTime() + BOOKING_SLOT_MINUTES * 60 * 1000,
          )
        : undefined;

    if (dto.appointmentDate || dto.serviceId || dto.barberId) {
      await this.availabilityService.assertSlotAvailable({
        barberId,
        serviceId,
        startTime: appointmentStartTime,
        excludeBookingId: booking.id,
      });
    }

    const updatedBooking = await this.prismaService.booking.update({
      where: { id: booking.id },
      data: {
        serviceId: dto.serviceId,
        barberId: dto.barberId,
        startTime: dto.appointmentDate,
        endTime: appointmentEndTime,
      },
      include: {
        service: true,
        barber: true,
      },
    });

    if (booking.customerEmail) {
      await this.resendService.sendEmail(
        booking.customerEmail,
        'Booking Updated',
        `<p>Your booking has been updated.</p>`,
      );
    }

    return updatedBooking;
  }

  async cancelGuestBookingByReference(reference: string) {
    const booking = await this.prismaService.booking.findFirst({
      where: this.getGuestBookingReferenceWhere(reference),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    return await this.prismaService.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByUserId: null,
      },
      include: {
        service: true,
        barber: true,
      },
    });
  }

  async cancelBooking(bookingId: string, userId: string, role: Role) {
    const booking = await this.prismaService.booking.findFirst({
      where: await this.getBookingAccessWhere(bookingId, userId, role),
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    return await this.prismaService.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledByUserId: userId,
      },
      include: {
        service: true,
        barber: true,
      },
    });
  }

  async getBookingDetails(bookingId: string, userId: string, role: Role) {
    const booking = await this.prismaService.booking.findFirst({
      where: await this.getBookingAccessWhere(bookingId, userId, role),
      include: { service: true, barber: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async getBookings(userId: string, query: GetBookingsQueryDto) {
    const userBookings = await this.prismaService.booking.findMany({
      where: {
        userId,
      },
      include: { service: true, barber: true },
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

  async linkGuestBookingsToUser(userId: string, email: string) {
    const result = await this.prismaService.booking.updateMany({
      where: {
        userId: null,
        customerEmail: {
          equals: email.trim(),
          mode: 'insensitive',
        },
      },
      data: { userId },
    } as never);

    return result.count;
  }

  private getGuestBookingReferenceWhere(reference: string) {
    return {
      id: reference.trim(),
      userId: null,
    };
  }

  private async getBookingAccessWhere(
    bookingId: string,
    userId: string,
    role: Role,
  ) {
    if (role === Role.Admin) {
      return { id: bookingId };
    }

    if (role === Role.Barber) {
      const barber = await this.prismaService.barber.findUnique({
        where: { userId },
        select: { id: true },
      });

      return {
        id: bookingId,
        barberId: barber?.id ?? '__missing_barber_profile__',
      };
    }

    return {
      id: bookingId,
      userId,
    };
  }
}
