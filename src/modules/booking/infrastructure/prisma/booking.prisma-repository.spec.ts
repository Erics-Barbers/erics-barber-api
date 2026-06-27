jest.mock('src/infrastructure/mail/resend.service', () => ({
  ResendService: jest.fn(),
}));

import { BookingService } from './booking.prisma-repository';

describe('BookingService', () => {
  const resendService = {
    sendEmail: jest.fn(),
  };

  const createPrismaService = () => ({
    service: {
      findFirst: jest.fn(),
    },
    barber: {
      findFirst: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates 30-minute bookings for the selected barber', async () => {
    const prismaService = createPrismaService();
    prismaService.service.findFirst.mockResolvedValue({
      id: 'service-id',
      durationMinutes: 30,
    });
    prismaService.barber.findFirst.mockResolvedValue({ id: 'barber-id' });
    prismaService.booking.findFirst.mockResolvedValue(null);
    prismaService.booking.create.mockResolvedValue({});
    resendService.sendEmail.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
    );
    const appointmentDate = new Date('2026-07-01T10:00:00.000Z');

    await bookingService.createBooking({
      userId: 'customer-id',
      serviceId: 'service-id',
      barberId: 'barber-id',
      appointmentDate,
    });

    expect(prismaService.booking.findFirst).toHaveBeenCalledWith({
      where: {
        barberId: 'barber-id',
        startTime: { lt: new Date('2026-07-01T10:30:00.000Z') },
        endTime: { gt: appointmentDate },
      },
    });
    expect(prismaService.booking.create).toHaveBeenCalledWith({
      data: {
        userId: 'customer-id',
        serviceId: 'service-id',
        barberId: 'barber-id',
        startTime: appointmentDate,
        endTime: new Date('2026-07-01T10:30:00.000Z'),
      },
    });
  });

  it('rejects bookings that do not start on a half-hour boundary', async () => {
    const prismaService = createPrismaService();
    prismaService.service.findFirst.mockResolvedValue({
      id: 'service-id',
      durationMinutes: 30,
    });
    prismaService.barber.findFirst.mockResolvedValue({ id: 'barber-id' });

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
    );

    await expect(
      bookingService.createBooking({
        userId: 'customer-id',
        serviceId: 'service-id',
        barberId: 'barber-id',
        appointmentDate: new Date('2026-07-01T10:15:00.000Z'),
      }),
    ).rejects.toThrow('Booking start time must be on the hour or half hour');
  });
});
