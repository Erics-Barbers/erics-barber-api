import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from 'src/generated/prisma/enums';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  readonly serviceId?: string;

  @IsOptional()
  @IsString()
  readonly barberId?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  readonly status?: BookingStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  readonly appointmentDate?: Date;

  @IsOptional()
  @IsString()
  readonly notes?: string;
}
