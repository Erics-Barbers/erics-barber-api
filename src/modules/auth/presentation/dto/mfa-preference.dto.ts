import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { MfaMethod } from 'src/generated/prisma/client';

export class MfaPreferenceDto {
  @ApiProperty({
    example: true,
    description: 'Whether MFA should be required during login',
  })
  @IsBoolean()
  readonly enabled!: boolean;

  @ApiProperty({
    enum: MfaMethod,
    example: MfaMethod.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEnum(MfaMethod)
  readonly method?: MfaMethod;
}
