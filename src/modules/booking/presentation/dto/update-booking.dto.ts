import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  readonly serviceId?: string;

  @IsOptional()
  @IsString()
  readonly barberId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly appointmentDate?: Date;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}
