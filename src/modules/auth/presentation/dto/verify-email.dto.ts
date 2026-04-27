import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Verification token sent to the user email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  token!: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ example: 'User logged in successfully' })
  message!: string;

  @ApiProperty({
    example: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    description: 'Access token',
  })
  accessToken!: string;
}
