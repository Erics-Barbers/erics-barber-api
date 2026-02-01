import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  readonly email: string;

  @ApiProperty({
    example: 'NewPassword123',
    description:
      'New password must be 8-20 characters long, contain at least one letter and one number',
  })
  @IsString()
  @Length(8, 20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, {
    message:
      'Password must be at least 8 characters long and contain at least one letter and one number',
  })
  readonly newPassword: string;
}
