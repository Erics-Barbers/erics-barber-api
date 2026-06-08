import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequestDto {
  @ApiProperty({
    example: 'user-id-123',
    description: 'User ID',
  })
  @IsString()
  readonly userId!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsString()
  readonly email!: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token',
  })
  @IsString()
  readonly accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description:
      'Rotated refresh token. Intended for trusted server-side clients such as the Next.js BFF to set as an HttpOnly browser cookie.',
  })
  @IsString()
  readonly refreshToken!: string;

  @ApiProperty({
    description: 'Success message',
  })
  @IsString()
  readonly message!: string;
}
