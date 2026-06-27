import { IsOptional, IsString, Matches } from 'class-validator';

export class GetAvailabilitySlotsQueryDto {
  @IsString()
  readonly barberId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  readonly date!: string;

  @IsOptional()
  @IsString()
  readonly serviceId?: string;
}

export class GetBarberAvailabilitySlotsQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  readonly date!: string;

  @IsOptional()
  @IsString()
  readonly serviceId?: string;
}
