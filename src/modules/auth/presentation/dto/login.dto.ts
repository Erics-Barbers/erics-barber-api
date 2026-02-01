import { IsEmail, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  readonly email: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'User password (8-20 characters)',
  })
  @IsEmail({}, { message: 'Password must be a valid string' })
  @Length(8, 20)
  readonly password: string;
}
