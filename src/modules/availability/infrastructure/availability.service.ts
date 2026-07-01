import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AvailabilityExceptionType,
  BookingStatus,
  DayOfWeek,
} from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { GetAvailabilitySlotsQueryDto } from '../presentation/dto/get-availability-slots.dto';
import {
  assertBookingDateIsBookable,
  SHOP_TIME_ZONE,
} from 'src/common/utils/booking-policy';

const SLOT_MINUTES = 30;
const DAY_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

type MinuteInterval = {
  startMinute: number;
  endMinute: number;
};

type AvailabilitySlot = {
  startTime: string;
  endTime: string;
  label: string;
  hour: string;
};

@Injectable()
export class AvailabilityService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailableSlots(query: GetAvailabilitySlotsQueryDto) {
    const serviceId = query.serviceId;
    assertBookingDateIsBookable(query.date);
    await this.assertActiveBarber(query.barberId);

    if (serviceId) {
      await this.assertActiveThirtyMinuteService(serviceId);
    }

    const dayOfWeek = this.getDayOfWeek(query.date);
    const dayStart = this.localDateTimeToUtc(query.date, 0);
    const dayEnd = this.localDateTimeToUtc(this.addDays(query.date, 1), 0);

    const [rules, exceptions, bookings] = await Promise.all([
      this.prismaService.barberAvailabilityRule.findMany({
        where: {
          barberId: query.barberId,
          dayOfWeek,
          isActive: true,
        },
        orderBy: { startMinute: 'asc' },
      }),
      this.prismaService.barberAvailabilityException.findMany({
        where: {
          barberId: query.barberId,
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
      }),
      this.prismaService.booking.findMany({
        where: {
          barberId: query.barberId,
          status: { not: BookingStatus.CANCELLED },
          startTime: { lt: dayEnd },
          endTime: { gt: dayStart },
        },
        select: {
          startTime: true,
          endTime: true,
        },
      }),
    ]);

    const intervals = this.applyExceptions(
      rules.map((rule) => ({
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
      })),
      exceptions.map((exception) => ({
        startMinute: exception.startMinute,
        endMinute: exception.endMinute,
        type: exception.type,
      })),
    );

    const now = new Date();
    const slots = intervals.flatMap((interval) =>
      this.generateSlots(query.date, interval),
    );
    const availableSlots = slots.filter((slot) => {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      return (
        startTime > now &&
        !bookings.some(
          (booking) =>
            booking.startTime < endTime && booking.endTime > startTime,
        )
      );
    });

    return {
      barberId: query.barberId,
      date: query.date,
      serviceId,
      slotMinutes: SLOT_MINUTES,
      timeZone: SHOP_TIME_ZONE,
      slots: availableSlots,
      hours: this.groupSlotsByHour(availableSlots),
    };
  }

  async assertSlotAvailable(options: {
    barberId: string;
    serviceId: string;
    startTime: Date;
    excludeBookingId?: string;
  }) {
    await this.assertActiveBarber(options.barberId);
    await this.assertActiveThirtyMinuteService(options.serviceId);

    if (!this.isHalfHourAligned(options.startTime)) {
      throw new BadRequestException(
        'Booking start time must be on the hour or half hour',
      );
    }

    const date = this.getLocalDateString(options.startTime);
    const startMinute = this.getLocalMinuteOfDay(options.startTime);
    const endMinute = startMinute + SLOT_MINUTES;

    if (endMinute > 1440) {
      throw new BadRequestException('Booking time is not available');
    }

    const slots = await this.getAvailableSlots({
      barberId: options.barberId,
      serviceId: options.serviceId,
      date,
    });

    const requestedSlot = slots.slots.find(
      (slot) => slot.startTime === options.startTime.toISOString(),
    );

    if (!requestedSlot && !options.excludeBookingId) {
      throw new ConflictException('Booking time is not available');
    }

    if (!requestedSlot && options.excludeBookingId) {
      await this.assertSlotInAvailabilityWindow(options.barberId, date, {
        startMinute,
        endMinute,
      });
    }

    const endTime = new Date(
      options.startTime.getTime() + SLOT_MINUTES * 60 * 1000,
    );
    const existingBooking = await this.prismaService.booking.findFirst({
      where: {
        barberId: options.barberId,
        status: { not: BookingStatus.CANCELLED },
        startTime: { lt: endTime },
        endTime: { gt: options.startTime },
        NOT: options.excludeBookingId
          ? { id: options.excludeBookingId }
          : undefined,
      },
    });

    if (existingBooking) {
      throw new ConflictException('Booking time is not available');
    }
  }

  private async assertSlotInAvailabilityWindow(
    barberId: string,
    date: string,
    requestedInterval: MinuteInterval,
  ) {
    const dayOfWeek = this.getDayOfWeek(date);
    const dayStart = this.localDateTimeToUtc(date, 0);
    const dayEnd = this.localDateTimeToUtc(this.addDays(date, 1), 0);
    const [rules, exceptions] = await Promise.all([
      this.prismaService.barberAvailabilityRule.findMany({
        where: { barberId, dayOfWeek, isActive: true },
      }),
      this.prismaService.barberAvailabilityException.findMany({
        where: {
          barberId,
          date: { gte: dayStart, lt: dayEnd },
        },
      }),
    ]);
    const intervals = this.applyExceptions(
      rules.map((rule) => ({
        startMinute: rule.startMinute,
        endMinute: rule.endMinute,
      })),
      exceptions.map((exception) => ({
        startMinute: exception.startMinute,
        endMinute: exception.endMinute,
        type: exception.type,
      })),
    );

    const isInsideAvailability = intervals.some(
      (interval) =>
        interval.startMinute <= requestedInterval.startMinute &&
        interval.endMinute >= requestedInterval.endMinute,
    );

    if (!isInsideAvailability) {
      throw new ConflictException('Booking time is not available');
    }
  }

  private async assertActiveBarber(barberId: string) {
    const barber = await this.prismaService.barber.findFirst({
      where: { id: barberId, isActive: true },
    });

    if (!barber) {
      throw new NotFoundException('Barber not found');
    }
  }

  private async assertActiveThirtyMinuteService(serviceId: string) {
    const service = await this.prismaService.service.findFirst({
      where: { id: serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.durationMinutes !== SLOT_MINUTES) {
      throw new BadRequestException('Service duration must be 30 minutes');
    }
  }

  private applyExceptions(
    rules: MinuteInterval[],
    exceptions: Array<{
      startMinute: number | null;
      endMinute: number | null;
      type: AvailabilityExceptionType;
    }>,
  ) {
    let intervals = this.mergeIntervals(rules);

    for (const exception of exceptions) {
      const exceptionInterval = {
        startMinute: exception.startMinute ?? 0,
        endMinute: exception.endMinute ?? 1440,
      };

      if (exception.type === AvailabilityExceptionType.AVAILABLE) {
        intervals = this.mergeIntervals([...intervals, exceptionInterval]);
        continue;
      }

      intervals = intervals.flatMap((interval) =>
        this.subtractInterval(interval, exceptionInterval),
      );
    }

    return intervals;
  }

  private generateSlots(date: string, interval: MinuteInterval) {
    const slots: AvailabilitySlot[] = [];

    for (
      let minute = interval.startMinute;
      minute + SLOT_MINUTES <= interval.endMinute;
      minute += SLOT_MINUTES
    ) {
      const startTime = this.localDateTimeToUtc(date, minute);
      const endTime = this.localDateTimeToUtc(date, minute + SLOT_MINUTES);
      const label = this.formatLocalTime(startTime);
      slots.push({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        label,
        hour: `${label.slice(0, 2)}:00`,
      });
    }

    return slots;
  }

  private groupSlotsByHour(slots: AvailabilitySlot[]) {
    const groups = new Map<string, AvailabilitySlot[]>();

    for (const slot of slots) {
      groups.set(slot.hour, [...(groups.get(slot.hour) ?? []), slot]);
    }

    return Array.from(groups, ([hour, hourSlots]) => ({
      hour,
      slots: hourSlots,
    }));
  }

  private mergeIntervals(intervals: MinuteInterval[]) {
    const sortedIntervals = [...intervals].sort(
      (left, right) => left.startMinute - right.startMinute,
    );
    const mergedIntervals: MinuteInterval[] = [];

    for (const interval of sortedIntervals) {
      const previous = mergedIntervals[mergedIntervals.length - 1];

      if (!previous || previous.endMinute < interval.startMinute) {
        mergedIntervals.push({ ...interval });
        continue;
      }

      previous.endMinute = Math.max(previous.endMinute, interval.endMinute);
    }

    return mergedIntervals;
  }

  private subtractInterval(
    interval: MinuteInterval,
    blockedInterval: MinuteInterval,
  ) {
    if (
      blockedInterval.endMinute <= interval.startMinute ||
      blockedInterval.startMinute >= interval.endMinute
    ) {
      return [interval];
    }

    const remainingIntervals: MinuteInterval[] = [];

    if (blockedInterval.startMinute > interval.startMinute) {
      remainingIntervals.push({
        startMinute: interval.startMinute,
        endMinute: blockedInterval.startMinute,
      });
    }

    if (blockedInterval.endMinute < interval.endMinute) {
      remainingIntervals.push({
        startMinute: blockedInterval.endMinute,
        endMinute: interval.endMinute,
      });
    }

    return remainingIntervals;
  }

  private getDayOfWeek(date: string) {
    const [year, month, day] = this.parseDate(date);
    const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
    return DAY_OF_WEEK[noonUtc.getUTCDay()];
  }

  private localDateTimeToUtc(date: string, minuteOfDay: number) {
    const [year, month, day] = this.parseDate(date);
    const hour = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const firstGuess = Date.UTC(year, month - 1, day, hour, minute);
    const firstOffset = this.getTimeZoneOffsetMinutes(new Date(firstGuess));
    const secondGuess = firstGuess - firstOffset * 60 * 1000;
    const secondOffset = this.getTimeZoneOffsetMinutes(new Date(secondGuess));
    return new Date(firstGuess - secondOffset * 60 * 1000);
  }

  private getTimeZoneOffsetMinutes(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: SHOP_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    const partValue = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);
    const localAsUtc = Date.UTC(
      partValue('year'),
      partValue('month') - 1,
      partValue('day'),
      partValue('hour'),
      partValue('minute'),
      partValue('second'),
    );

    return Math.round((localAsUtc - date.getTime()) / 60000);
  }

  private getLocalDateString(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: SHOP_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const partValue = (type: string) =>
      parts.find((part) => part.type === type)?.value;
    return `${partValue('year')}-${partValue('month')}-${partValue('day')}`;
  }

  private getLocalMinuteOfDay(date: Date) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: SHOP_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const [hour, minute] = formatter.format(date).split(':').map(Number);
    return hour * 60 + minute;
  }

  private formatLocalTime(date: Date) {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: SHOP_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  }

  private addDays(date: string, days: number) {
    const [year, month, day] = this.parseDate(date);
    const utcDate = new Date(Date.UTC(year, month - 1, day + days));
    return utcDate.toISOString().slice(0, 10);
  }

  private parseDate(date: string) {
    return date.split('-').map(Number) as [number, number, number];
  }

  private isHalfHourAligned(date: Date) {
    return (
      (date.getUTCMinutes() === 0 || date.getUTCMinutes() === 30) &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    );
  }
}
