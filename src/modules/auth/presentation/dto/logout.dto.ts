import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogOutDto {
  @ApiProperty({
    example: 'some-refresh-token',
    description: 'Refresh token for logging out',
  })
  @IsString()
  readonly refreshToken: string;

  @ApiProperty({
    example: 'user-id-123',
    description: 'User ID associated with the refresh token',
  })
  @IsString()
  readonly userId: string;
}
