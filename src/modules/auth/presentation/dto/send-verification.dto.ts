import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class SendVerificationDto {
  @ApiProperty({
    description: 'Email address to send the verification email to',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;
}
