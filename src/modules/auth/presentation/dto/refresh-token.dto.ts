import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
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
