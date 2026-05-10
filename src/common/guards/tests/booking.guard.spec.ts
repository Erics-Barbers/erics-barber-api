import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { BookingGuard } from '../booking.guard';

describe('BookingGuard', () => {
  let bookingGuard: BookingGuard;

  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    bookingGuard = new BookingGuard();
  });

  afterEach(() => {
    delete process.env.BOOKING_ENABLED;
  });

  it('should allow access when BOOKING_ENABLED is "true"', () => {
    process.env.BOOKING_ENABLED = 'true';

    const result = bookingGuard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when BOOKING_ENABLED is not set', () => {
    delete process.env.BOOKING_ENABLED;

    expect(() => bookingGuard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when BOOKING_ENABLED is "false"', () => {
    process.env.BOOKING_ENABLED = 'false';

    expect(() => bookingGuard.canActivate(mockContext)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when BOOKING_ENABLED is any value other than "true"', () => {
    process.env.BOOKING_ENABLED = '1';

    expect(() => bookingGuard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
