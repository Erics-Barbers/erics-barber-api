jest.mock('src/infrastructure/mail/resend.service', () => ({
  ResendService: jest.fn(),
}));

import { BookingService } from './booking.prisma-repository';
import { BookingStatus } from 'src/generated/prisma/enums';

describe('BookingService', () => {
  const resendService = {
    sendEmail: jest.fn(),
  };
  const availabilityService = {
    assertSlotAvailable: jest.fn(),
  };

  const createPrismaService = () => ({
    booking: {
      create: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates 30-minute bookings for the selected barber', async () => {
    const prismaService = createPrismaService();
    prismaService.booking.create.mockResolvedValue({});
    resendService.sendEmail.mockResolvedValue(undefined);
    availabilityService.assertSlotAvailable.mockResolvedValue(undefined);

    const bookingService = new BookingService(
      prismaService as never,
      resendService as never,
      availabilityService as never,
    );
    const appointmentDate = new Date('2026-07-01T10:00:00.000Z');

    await bookingService.createBooking('customer-id', {
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
    });
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
});
