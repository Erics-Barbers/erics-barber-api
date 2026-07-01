import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BookingReferenceDto {
  @ApiProperty({
    description: 'Booking reference shown to the customer.',
    example: '93f86393-7e60-4f2e-bf22-ef9f95d6e071',
  })
  @IsString()
  readonly reference!: string;
}
