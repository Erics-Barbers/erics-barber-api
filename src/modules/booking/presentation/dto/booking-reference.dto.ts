import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BookingReferenceDto {
  @ApiProperty({
    description: 'High-entropy UUID booking reference shown to the customer.',
    example: '93f86393-7e60-4f2e-bf22-ef9f95d6e071',
    format: 'uuid',
  })
  @IsUUID('4')
  readonly reference!: string;
}
