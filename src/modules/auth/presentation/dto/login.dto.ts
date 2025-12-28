import { IsEmail, Length } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  readonly email: string;

  @Length(8, 20)
  readonly password: string;
}
