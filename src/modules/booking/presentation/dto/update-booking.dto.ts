import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Replacement service for the booking.',
    example: 'cmservice123',
  })
  @IsOptional()
  @IsString()
  readonly serviceId?: string;

  @ApiPropertyOptional({
    description: 'Replacement barber for the booking.',
    example: 'cmbarber123',
  })
  @IsOptional()
  @IsString()
  readonly barberId?: string;

  @ApiPropertyOptional({
    description:
      'Replacement booking start time. Must be on the hour or half-hour mark, must not be today, and must be no more than 1 month ahead. Existing bookings can only be changed online up to the day before the appointment.',
    example: '2026-07-02T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly appointmentDate?: Date;
}
