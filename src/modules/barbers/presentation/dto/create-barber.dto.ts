import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBarberDto {
  @ApiProperty({
    example: 'dfsdfmk',
    description: 'Barber ID',
  })
  @IsString()
  readonly barberId!: string;

  @ApiProperty({
    example: 'Eric',
    description: "Barber's Name",
  })
  @IsString()
  readonly name!: string;

  @ApiProperty({
    example: 'eric@barbershop-luton.com',
    description: "Barber's email address",
  })
  @IsString()
  readonly email!: string;

  @ApiProperty({
    example: '+44 7907882325',
    description: "Barber's phone number",
  })
  @IsString()
  readonly phone!: string;
}
