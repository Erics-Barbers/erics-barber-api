/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class BookingGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Check the environment variable (default to false if not set)
    if (process.env.BOOKING_ENABLED !== 'true') {
      throw new ForbiddenException(
        'Booking functionality is currently disabled.',
      );
    }
    return true;
  }
}
