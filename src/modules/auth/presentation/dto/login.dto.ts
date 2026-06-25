import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MfaMethod } from 'src/generated/prisma/client';

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

  @ApiProperty({
    example: false,
    required: false,
    description:
      'When true, issue a longer-lived refresh session for staying signed in.',
  })
  @IsOptional()
  @IsBoolean()
  readonly rememberMe?: boolean;
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

  @ApiProperty({
    example: 604800,
    description: 'Refresh cookie lifetime the BFF should apply, in seconds.',
  })
  refreshMaxAgeSeconds!: number;
}

export class LoginMfaRequiredResponseDto {
  @ApiProperty({ example: 'MFA required' })
  message!: string;

  @ApiProperty({ example: 'MFA_REQUIRED' })
  code!: 'MFA_REQUIRED';

  @ApiProperty({ example: true })
  mfaRequired!: true;

  @ApiProperty({
    example: 'cmfchallenge123',
    description: 'Short-lived challenge ID to submit with the MFA code',
  })
  challengeId!: string;

  @ApiProperty({
    enum: MfaMethod,
    example: MfaMethod.EMAIL,
  })
  mfaMethod!: MfaMethod;
}

export type LoginResultDto = LoginResponseDto | LoginMfaRequiredResponseDto;
