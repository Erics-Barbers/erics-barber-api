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

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  static create(props: {
    accessToken: string;
    refreshToken: string;
  }): AuthResponseDto {
    return new AuthResponseDto(props.accessToken, props.refreshToken);
  }
}
