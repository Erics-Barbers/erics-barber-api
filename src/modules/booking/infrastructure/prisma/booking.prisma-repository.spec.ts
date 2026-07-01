jest.mock('src/infrastructure/mail/resend.service', () => ({
  ResendService: jest.fn(),
}));

import { BookingService } from './booking.prisma-repository';
import { BookingStatus } from 'src/generated/prisma/enums';
import { Role } from 'src/common/constants/role.enum';

describe('BookingService', () => {
  const resendService = {
    sendEmail: jest.fn(),
  };
  const availabilityService = {
    assertSlotAvailable: jest.fn(),
  };

  const createPrismaService = () => ({
    user: {
      findUnique: jest.fn(),
    },
    barber: {
      findUnique: jest.fn(),
    },
    booking: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates 30-minute bookings for the selected barber', async () => {
    const prismaService = createPrismaService();
    const createdBooking = {
      id: 'booking-id',
      serviceId: 'service-id',
      barberId: 'barber-id',
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-08-01T10:00:00.000Z'),
      service: { id: 'service-id', name: 'Haircut' },
      barber: { id: 'barber-id', displayName: 'Eric' },
    };
    prismaService.user.findUnique.mockResolvedValue({
      email: 'customer@example.com',
      name: 'Customer Name',
    });
    prismaService.booking.create.mockResolvedValue(createdBooking);
    resendService.sendEmail.mockResolvedValue(undefined);
    availabilityService.assertSlotAvailable.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );
    const appointmentDate = new Date('2026-08-01T10:00:00.000Z');

    const result = await bookingService.createBooking('customer-id', {
      serviceId: 'service-id',
      barberId: 'barber-id',
      appointmentDate,
    });

    expect(availabilityService.assertSlotAvailable).toHaveBeenCalledWith({
      barberId: 'barber-id',
      serviceId: 'service-id',
      startTime: appointmentDate,
    });
    expect(prismaService.booking.create).toHaveBeenCalledWith({
      data: {
        userId: 'customer-id',
        customerName: 'Customer Name',
        customerEmail: 'customer@example.com',
        customerPhone: undefined,
        serviceId: 'service-id',
        barberId: 'barber-id',
        status: BookingStatus.CONFIRMED,
        startTime: appointmentDate,
        endTime: new Date('2026-08-01T10:30:00.000Z'),
      },
      include: {
        service: true,
        barber: true,
      },
    });
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'Booking Confirmation',
      expect.stringContaining('Booking confirmed'),
    );
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'Booking Confirmation',
      expect.stringContaining('booking-id'),
    );
    expect(result).toBe(createdBooking);
  });

  it('creates guest bookings with supplied contact details', async () => {
    const prismaService = createPrismaService();
    const createdBooking = {
      id: 'booking-id',
      barber: { displayName: 'Eric' },
      customerEmail: 'guest@example.com',
      customerName: 'Guest Customer',
      customerPhone: '+447900000000',
      service: { name: 'Haircut' },
      status: BookingStatus.CONFIRMED,
      startTime: new Date('2026-08-01T10:00:00.000Z'),
    };
    prismaService.booking.create.mockResolvedValue(createdBooking);
    resendService.sendEmail.mockResolvedValue(undefined);
    availabilityService.assertSlotAvailable.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );
    const appointmentDate = new Date('2026-08-01T10:00:00.000Z');

    const result = await bookingService.createBooking(undefined, {
      appointmentDate,
      barberId: 'barber-id',
      customerEmail: 'guest@example.com',
      customerName: 'Guest Customer',
      customerPhone: '+447900000000',
      serviceId: 'service-id',
    });

    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    expect(prismaService.booking.create).toHaveBeenCalledWith({
      data: {
        userId: undefined,
        customerName: 'Guest Customer',
        customerEmail: 'guest@example.com',
        customerPhone: '+447900000000',
        serviceId: 'service-id',
        barberId: 'barber-id',
        status: BookingStatus.CONFIRMED,
        startTime: appointmentDate,
        endTime: new Date('2026-08-01T10:30:00.000Z'),
      },
      include: {
        service: true,
        barber: true,
      },
    });
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'guest@example.com',
      'Booking Confirmation',
      expect.stringContaining('Booking confirmed'),
    );
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'guest@example.com',
      'Booking Confirmation',
      expect.stringContaining('booking-id'),
    );
    expect(result).toBe(createdBooking);
  });

  it('rejects guest bookings without contact details', async () => {
    const prismaService = createPrismaService();
    availabilityService.assertSlotAvailable.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await expect(
      bookingService.createBooking(undefined, {
        serviceId: 'service-id',
        barberId: 'barber-id',
        appointmentDate: new Date('2026-08-01T10:00:00.000Z'),
      }),
    ).rejects.toThrow('Customer name, email, and phone are required');

    expect(prismaService.booking.create).not.toHaveBeenCalled();
  });

  it('rejects bookings that do not start on a half-hour boundary', async () => {
    const prismaService = createPrismaService();
    availabilityService.assertSlotAvailable.mockRejectedValue(
      new Error('Booking start time must be on the hour or half hour'),
    );

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await expect(
      bookingService.createBooking('customer-id', {
        serviceId: 'service-id',
        barberId: 'barber-id',
        appointmentDate: new Date('2026-08-01T10:15:00.000Z'),
      }),
    ).rejects.toThrow('Booking start time must be on the hour or half hour');
  });

  it('scopes customer booking details to the authenticated user', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.findFirst.mockResolvedValue({ id: 'booking-id' });
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await bookingService.getBookingDetails(
      'booking-id',
      'customer-id',
      Role.Customer,
    );

    expect(prismaService.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        userId: 'customer-id',
      },
      include: { service: true, barber: true },
    });
  });

  it('cancels an accessible customer booking through a dedicated status update', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.findFirst.mockResolvedValue({
      id: 'booking-id',
      status: BookingStatus.CONFIRMED,
    });
    prismaService.booking.update.mockResolvedValue({});
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await bookingService.cancelBooking(
      'booking-id',
      'customer-id',
      Role.Customer,
    );

    expect(prismaService.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        userId: 'customer-id',
      },
    });
    expect(prismaService.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-id' },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: expect.any(Date) as Date,
        cancelledByUserId: 'customer-id',
      },
      include: {
        service: true,
        barber: true,
      },
    });
  });

  it('rejects updates to cancelled customer bookings', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.findFirst.mockResolvedValue({
      id: 'booking-id',
      status: BookingStatus.CANCELLED,
    });
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await expect(
      bookingService.updateBooking('booking-id', 'customer-id', Role.Customer, {
        appointmentDate: new Date('2026-08-01T10:00:00.000Z'),
      }),
    ).rejects.toThrow('Cancelled bookings cannot be updated');

    expect(prismaService.booking.update).not.toHaveBeenCalled();
  });

  it('rejects cancelling already-cancelled customer bookings', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.findFirst.mockResolvedValue({
      id: 'booking-id',
      status: BookingStatus.CANCELLED,
    });
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    await expect(
      bookingService.cancelBooking('booking-id', 'customer-id', Role.Customer),
    ).rejects.toThrow('Booking is already cancelled');

    expect(prismaService.booking.update).not.toHaveBeenCalled();
  });

  it('looks up unlinked guest bookings by reference', async () => {
    const prismaService = createPrismaService();
    const booking = {
      id: 'booking-id',
      userId: null,
      customerEmail: 'guest@example.com',
    };
    prismaService.booking.findFirst.mockResolvedValue(booking);
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    const result =
      await bookingService.getGuestBookingByReference(' booking-id ');

    expect(prismaService.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        userId: null,
      },
      include: { service: true, barber: true },
    });
    expect(result).toBe(booking);
  });

  it('cancels guest bookings by reference', async () => {
    const prismaService = createPrismaService();
    const booking = {
      id: 'booking-id',
      userId: null,
      status: BookingStatus.CONFIRMED,
    };
    const cancelledBooking = {
      ...booking,
      status: BookingStatus.CANCELLED,
    };
    prismaService.booking.findFirst.mockResolvedValue(booking);
    prismaService.booking.update.mockResolvedValue(cancelledBooking);
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    const result =
      await bookingService.cancelGuestBookingByReference('booking-id');

    expect(prismaService.booking.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'booking-id',
        userId: null,
      },
    });
    expect(prismaService.booking.update).toHaveBeenCalledWith({
      where: { id: 'booking-id' },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: expect.any(Date) as Date,
        cancelledByUserId: null,
      },
      include: {
        service: true,
        barber: true,
      },
    });
    expect(result).toBe(cancelledBooking);
  });

  it('links unowned guest bookings by email to a verified user', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.updateMany.mockResolvedValue({ count: 2 });
    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );

    const count = await bookingService.linkGuestBookingsToUser(
      'customer-id',
      'Customer@Example.com ',
    );

    expect(prismaService.booking.updateMany).toHaveBeenCalledWith({
      where: {
        userId: null,
        customerEmail: {
          equals: 'Customer@Example.com',
          mode: 'insensitive',
        },
      },
      data: { userId: 'customer-id' },
    });
    expect(count).toBe(2);
  });
});
