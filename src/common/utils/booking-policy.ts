import { BadRequestException } from '@nestjs/common';

export const SHOP_TIME_ZONE = 'Europe/London';
export const BOOKING_ADVANCE_MONTHS = 1;

export function assertAppointmentDateIsBookable(
  appointmentDate: Date,
  referenceDate = new Date(),
) {
  assertBookingDateIsBookable(
    getShopDateString(appointmentDate),
    referenceDate,
  );
}

export function assertBookingDateIsBookable(
  bookingDate: string,
  referenceDate = new Date(),
) {
  const today = getShopDateString(referenceDate);
  const latestDate = addCalendarMonths(today, BOOKING_ADVANCE_MONTHS);

  if (compareDateStrings(bookingDate, today) <= 0) {
    throw new BadRequestException(
      'Bookings cannot be made for today or a past date. Please choose a future date.',
    );
  }

  if (compareDateStrings(bookingDate, latestDate) > 0) {
    throw new BadRequestException(
      'Bookings can only be made up to 1 month in advance.',
    );
  }
}

export function assertBookingCanBeChangedOnline(
  bookingStartTime: Date,
  referenceDate = new Date(),
) {
  const today = getShopDateString(referenceDate);
  const bookingDate = getShopDateString(bookingStartTime);

  if (compareDateStrings(bookingDate, today) <= 0) {
    throw new BadRequestException(
      'Bookings can only be rescheduled or cancelled online up to the day before the appointment. Contact the shop for same-day changes.',
    );
  }
}

export function getBookingDateWindow(referenceDate = new Date()) {
  const today = getShopDateString(referenceDate);

  return {
    earliestDate: addDays(today, 1),
    latestDate: addCalendarMonths(today, BOOKING_ADVANCE_MONTHS),
  };
}

export function getShopDateString(date: Date) {
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

function addDays(date: string, days: number) {
  const [year, month, day] = parseDate(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));

  return utcDate.toISOString().slice(0, 10);
}

function addCalendarMonths(date: string, monthsToAdd: number) {
  const [year, month, day] = parseDate(date);
  const targetMonthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const targetMonth = normalizedMonthIndex + 1;
  const targetDay = Math.min(day, getDaysInMonth(targetYear, targetMonth));

  return [
    targetYear,
    String(targetMonth).padStart(2, '0'),
    String(targetDay).padStart(2, '0'),
  ].join('-');
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function compareDateStrings(left: string, right: string) {
  return left.localeCompare(right);
}

function parseDate(date: string) {
  return date.split('-').map(Number) as [number, number, number];
}
