import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetBookingDto {
  @IsString()
  readonly id!: string;

  @IsString()
  readonly userId!: string;
}

export class GetAllBookingsDto {
  @IsString()
  readonly userId!: string;
}

export class GetBookingsQueryDto {
  @IsString()
  readonly userId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  readonly limit?: number;
}
