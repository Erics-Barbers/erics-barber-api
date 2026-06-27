import { Type } from 'class-transformer';
import { IsDate, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Service selected for the booking.',
    example: 'cmservice123',
  })
  @IsString()
  readonly serviceId!: string;

  @ApiProperty({
    description: 'Barber selected for the booking.',
    example: 'cmbarber123',
  })
  @IsString()
  readonly barberId!: string;

  @ApiProperty({
    description: 'Booking start time. Must be on the hour or half-hour mark.',
    example: '2026-07-01T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  readonly appointmentDate!: Date;
}
