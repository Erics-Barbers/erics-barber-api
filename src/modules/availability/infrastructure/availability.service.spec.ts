import {
  AvailabilityExceptionType,
  BookingStatus,
  DayOfWeek,
} from 'src/generated/prisma/enums';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  const createPrismaService = () => ({
    barber: {
      findFirst: jest.fn().mockResolvedValue({ id: 'barber-id' }),
    },
    service: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'service-id',
        durationMinutes: 30,
      }),
    },
    barberAvailabilityRule: {
      findMany: jest.fn().mockResolvedValue([
        {
          barberId: 'barber-id',
          dayOfWeek: DayOfWeek.MONDAY,
          startMinute: 540,
          endMinute: 660,
          isActive: true,
        },
      ]),
    },
    barberAvailabilityException: {
      findMany: jest.fn().mockResolvedValue([
        {
          barberId: 'barber-id',
          date: new Date('2026-07-06T00:00:00.000Z'),
          startMinute: 600,
          endMinute: 630,
          type: AvailabilityExceptionType.UNAVAILABLE,
        },
      ]),
    },
    booking: {
      findMany: jest.fn().mockResolvedValue([
        {
          startTime: new Date('2026-07-06T08:30:00.000Z'),
          endTime: new Date('2026-07-06T09:00:00.000Z'),
        },
      ]),
      findFirst: jest.fn().mockResolvedValue(null),
    },
  });

  it('returns available slots grouped by hour for a barber day', async () => {
    const prismaService = createPrismaService();
    const availabilityService = new AvailabilityService(prismaService as never);

    const result = await availabilityService.getAvailableSlots({
      barberId: 'barber-id',
      serviceId: 'service-id',
      date: '2026-07-06',
    });

    expect(result.slotMinutes).toBe(30);
    expect(result.timeZone).toBe('Europe/London');
    expect(result.slots.map((slot) => slot.label)).toEqual(['09:00', '10:30']);
    expect(prismaService.booking.findMany).toHaveBeenCalledWith({
      where: {
        barberId: 'barber-id',
        status: { not: BookingStatus.CANCELLED },
        startTime: { lt: new Date('2026-07-06T23:00:00.000Z') },
        endTime: { gt: new Date('2026-07-05T23:00:00.000Z') },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });
    expect(result.hours).toEqual([
      {
        hour: '09:00',
        slots: [result.slots[0]],
      },
      {
        hour: '10:00',
        slots: [result.slots[1]],
      },
    ]);
  });

  it('rejects booking validation when the selected time is outside availability', async () => {
    const prismaService = createPrismaService();
    const availabilityService = new AvailabilityService(prismaService as never);

    await expect(
      availabilityService.assertSlotAvailable({
        barberId: 'barber-id',
        serviceId: 'service-id',
        startTime: new Date('2026-07-06T10:00:00.000Z'),
      }),
    ).rejects.toThrow('Booking time is not available');
  });
});
