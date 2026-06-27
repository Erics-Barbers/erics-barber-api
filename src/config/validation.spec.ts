import {
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';
import { globalValidationPipeOptions } from './validation';
import { LoginRequestDto } from '../modules/auth/presentation/dto/login.dto';
import { GetBookingsQueryDto } from '../modules/booking/presentation/dto/get-booking.dto';
import { CreateBookingDto } from '../modules/booking/presentation/dto/create-booking.dto';

describe('globalValidationPipeOptions', () => {
  const pipe = new ValidationPipe(globalValidationPipeOptions);

  it('rejects unexpected request properties', async () => {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: LoginRequestDto,
    };

    await expect(
      pipe.transform(
        {
          email: 'customer@example.com',
          password: 'Password123!',
          role: 'Admin',
        },
        metadata,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('transforms validated query values', async () => {
    const metadata: ArgumentMetadata = {
      type: 'query',
      metatype: GetBookingsQueryDto,
    };

    const result = (await pipe.transform(
      {
        page: '2',
        limit: '25',
      },
      metadata,
    )) as GetBookingsQueryDto;

    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });

  it('transforms validated date strings', async () => {
    const metadata: ArgumentMetadata = {
      type: 'body',
      metatype: CreateBookingDto,
    };

    const result = (await pipe.transform(
      {
        serviceId: 'service-id',
        barberId: 'barber-id',
        appointmentDate: '2026-07-01T10:00:00.000Z',
      },
      metadata,
    )) as CreateBookingDto;

    expect(result.appointmentDate).toBeInstanceOf(Date);
  });
});
