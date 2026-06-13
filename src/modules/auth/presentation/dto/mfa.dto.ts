import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MfaDto {
  @ApiProperty({
    example: 'cmfchallenge123',
    description: 'MFA challenge ID returned by the login endpoint',
  })
  @IsString()
  readonly challengeId!: string;

  @ApiProperty({
    example: '123456',
    description: 'Short-lived MFA code sent to the user',
  })
  @IsString()
  readonly code!: string;
}
