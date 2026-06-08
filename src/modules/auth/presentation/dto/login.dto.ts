import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  readonly email!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must be 8-20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsString()
  readonly password!: string;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'User logged in successfully' })
  message!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Refresh token. Intended for trusted server-side clients such as the Next.js BFF to set as an HttpOnly browser cookie.',
  })
  refreshToken!: string;
}
