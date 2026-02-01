import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaDto {
  @ApiProperty({
    example: 'user-id-123',
    description: 'User ID for MFA verification',
  })
  @IsString()
  readonly userId: string;

  @ApiProperty({
    example: '123456',
    description: 'MFA code for verification',
  })
  @IsString()
  readonly mfaCode: string;
}
