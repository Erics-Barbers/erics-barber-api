import { IsEmail, IsString, IsStrongPassword } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  readonly email!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must be 8-20 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsString()
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be 8-20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  readonly password!: string;
}
