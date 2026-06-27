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
      'Replacement booking start time. Must be on the hour or half-hour mark.',
    example: '2026-07-01T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly appointmentDate?: Date;
}
