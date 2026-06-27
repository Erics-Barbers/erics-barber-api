import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  readonly serviceId!: string;

  @IsString()
  readonly barberId!: string;

  @Type(() => Date)
  @IsDate()
  readonly appointmentDate!: Date;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}
