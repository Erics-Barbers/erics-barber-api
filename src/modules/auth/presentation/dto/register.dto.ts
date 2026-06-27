import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'Eric Barber',
    description: 'User display name',
    minLength: 2,
    maxLength: 80,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80, { message: 'Name must be 80 characters or less' })
  readonly name!: string;

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
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20, {
    message:
      'Password must be 8-20 characters, include at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
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
