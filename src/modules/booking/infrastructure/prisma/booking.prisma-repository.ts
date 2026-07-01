import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'src/common/constants/role.enum';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma/client';
import { CreateBookingDto } from '../../presentation/dto/create-booking.dto';
import { UpdateBookingDto } from '../../presentation/dto/update-booking.dto';
import { GetBookingsQueryDto } from '../../presentation/dto/get-booking.dto';
import { AvailabilityService } from 'src/modules/availability/infrastructure/availability.service';
import {
  BookingStatus,
  OutboxEventStatus,
  OutboxEventType,
} from 'src/generated/prisma/enums';
import {
  assertAppointmentDateIsBookable,
  assertBookingCanBeChangedOnline,
} from 'src/common/utils/booking-policy';

const BOOKING_SLOT_MINUTES = 30;

@Injectable()
export class BookingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async createBooking(userId: string | undefined, dto: CreateBookingDto) {
    assertAppointmentDateIsBookable(dto.appointmentDate);

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

    const booking = await this.createBookingRow({
      userId,
      customerName,
      customerEmail,
      customerPhone,
      serviceId: dto.serviceId,
      barberId: dto.barberId,
      appointmentDate: dto.appointmentDate,
      appointmentEndTime,
    });

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

    assertBookingCanBeChangedOnline(booking.startTime);

    if (dto.appointmentDate) {
      assertAppointmentDateIsBookable(dto.appointmentDate);
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
    const updatedBooking = await this.updateBookingRow(bookingId, {
      serviceId: dto.serviceId,
      barberId: dto.barberId,
      startTime: dto.appointmentDate,
      endTime: appointmentEndTime,
    });

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

    assertBookingCanBeChangedOnline(booking.startTime);

    if (dto.appointmentDate) {
      assertAppointmentDateIsBookable(dto.appointmentDate);
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

    const updatedBooking = await this.updateBookingRow(booking.id, {
      serviceId: dto.serviceId,
      barberId: dto.barberId,
      startTime: dto.appointmentDate,
      endTime: appointmentEndTime,
    });

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

    assertBookingCanBeChangedOnline(booking.startTime);

    return await this.cancelBookingRow(booking.id, {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledByUserId: null,
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

    assertBookingCanBeChangedOnline(booking.startTime);

    return await this.cancelBookingRow(bookingId, {
      status: BookingStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledByUserId: userId,
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

  async getBookings(userId: string, role: Role, query: GetBookingsQueryDto) {
    const userBookings = await this.prismaService.booking.findMany({
      where: role === Role.Admin ? {} : { userId },
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
    };
  }

  private async createBookingRow(options: {
    userId: string | undefined;
    customerName: string;
    customerEmail: string;
    customerPhone: string | undefined;
    serviceId: string;
    barberId: string;
    appointmentDate: Date;
    appointmentEndTime: Date;
  }) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const booking = await tx.booking.create({
          data: {
            userId: options.userId,
            customerName: options.customerName,
            customerEmail: options.customerEmail,
            customerPhone: options.customerPhone,
            serviceId: options.serviceId,
            barberId: options.barberId,
            status: BookingStatus.CONFIRMED,
            startTime: options.appointmentDate,
            endTime: options.appointmentEndTime,
          },
          include: {
            service: true,
            barber: true,
          },
        });

        await this.enqueueBookingEmailEvent(
          tx,
          OutboxEventType.BOOKING_CONFIRMATION_EMAIL,
          options.customerEmail,
          booking,
        );

        return booking;
      });
    } catch (error) {
      this.throwSlotConflictIfUniqueConstraint(error);
      throw error;
    }
  }

  private async updateBookingRow(
    bookingId: string,
    data: {
      serviceId?: string;
      barberId?: string;
      startTime?: Date;
      endTime?: Date;
    },
  ) {
    try {
      return await this.prismaService.$transaction(async (tx) => {
        const booking = await tx.booking.update({
          where: { id: bookingId },
          data,
          include: {
            service: true,
            barber: true,
          },
        });

        if (booking.customerEmail) {
          await this.enqueueBookingEmailEvent(
            tx,
            OutboxEventType.BOOKING_UPDATED_EMAIL,
            booking.customerEmail,
            booking,
          );
        }

        return booking;
      });
    } catch (error) {
      this.throwSlotConflictIfUniqueConstraint(error);
      throw error;
    }
  }

  private async cancelBookingRow(
    bookingId: string,
    data: {
      status: BookingStatus;
      cancelledAt: Date;
      cancelledByUserId: string | null;
    },
  ) {
    return await this.prismaService.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data,
        include: {
          service: true,
          barber: true,
        },
      });

      if (booking.customerEmail) {
        await this.enqueueBookingEmailEvent(
          tx,
          OutboxEventType.BOOKING_CANCELLED_EMAIL,
          booking.customerEmail,
          booking,
        );
      }

      return booking;
    });
  }

  private async enqueueBookingEmailEvent(
    tx: Prisma.TransactionClient,
    type: OutboxEventType,
    to: string,
    booking: {
      id: string;
      startTime: Date;
      status: BookingStatus;
      barber?: { displayName: string } | null;
      service?: { name: string; pricePence: number } | null;
    },
  ) {
    await tx.outboxEvent.create({
      data: {
        type,
        status: OutboxEventStatus.PENDING,
        payload: {
          appointmentDate: booking.startTime.toISOString(),
          barberName: booking.barber?.displayName ?? null,
          bookingReference: booking.id,
          pricePence: booking.service?.pricePence ?? null,
          serviceName: booking.service?.name ?? null,
          status: booking.status,
          to,
        },
      },
    });
  }

  private throwSlotConflictIfUniqueConstraint(error: unknown): never | void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Booking time is not available');
    }
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
