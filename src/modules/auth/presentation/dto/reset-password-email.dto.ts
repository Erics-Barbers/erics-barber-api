import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResetPasswordEmailDto {
  @ApiProperty({
    description: 'Email address to send the reset password email to',
    example: 'user@example.com',
  })
  @IsString()
  email: string;
}
