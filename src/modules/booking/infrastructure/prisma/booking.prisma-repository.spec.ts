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
      service: { id: 'service-id' },
      barber: { id: 'barber-id' },
    };
    prismaService.user.findUnique.mockResolvedValue({
      email: 'customer@example.com',
    });
    prismaService.booking.create.mockResolvedValue(createdBooking);
    resendService.sendEmail.mockResolvedValue(undefined);
    availabilityService.assertSlotAvailable.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );
    const appointmentDate = new Date('2026-07-01T10:00:00.000Z');

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
        serviceId: 'service-id',
        barberId: 'barber-id',
        status: BookingStatus.CONFIRMED,
        startTime: appointmentDate,
        endTime: new Date('2026-07-01T10:30:00.000Z'),
      },
      include: {
        service: true,
        barber: true,
      },
    });
    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'Booking Confirmation',
      '<p>Your booking for 2026-07-01T10:00:00.000Z has been confirmed.</p>',
    );
    expect(result).toBe(createdBooking);
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
        appointmentDate: new Date('2026-07-01T10:15:00.000Z'),
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
      include: { service: true },
    });
  });

  it('cancels an accessible customer booking through a dedicated status update', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.findFirst.mockResolvedValue({ id: 'booking-id' });
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
      data: { status: BookingStatus.CANCELLED },
    });
  });
});
