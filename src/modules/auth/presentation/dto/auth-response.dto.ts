import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'dGhpc2lzYXJlZnJlc2h0b2tlbg==',
    description: 'JWT refresh token',
  })
  refreshToken: string;
  refreshMaxAgeSeconds: number;

  constructor(
    accessToken: string,
    refreshToken: string,
    refreshMaxAgeSeconds: number,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.refreshMaxAgeSeconds = refreshMaxAgeSeconds;
  }

  static create(props: {
    accessToken: string;
    refreshToken: string;
    refreshMaxAgeSeconds: number;
  }): AuthResponseDto {
    return new AuthResponseDto(
      props.accessToken,
      props.refreshToken,
      props.refreshMaxAgeSeconds,
    );
  }
}
