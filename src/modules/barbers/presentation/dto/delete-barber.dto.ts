/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteBarberDto {
  @ApiProperty({
    example: 'dfsdfmk',
    description: 'Barber ID',
  })
  @IsString()
  readonly id!: string;
}
