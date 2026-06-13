import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBarberDto {
  @ApiProperty({
    example: '+44 7907882325',
    description: "Barber's phone number",
    required: false,
  })
  @IsOptional()
  @IsString()
  readonly phone?: string;
}
