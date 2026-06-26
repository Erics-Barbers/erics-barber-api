import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum PasswordResetSurface {
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
}

export class ResetPasswordEmailDto {
  @ApiProperty({
    description: 'Email address to send the reset password email to',
    example: 'user@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: PasswordResetSurface,
    required: false,
    description:
      'Frontend surface that requested the reset link. Used to choose the correct configured reset URL.',
    example: PasswordResetSurface.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(PasswordResetSurface)
  surface?: PasswordResetSurface;
}
