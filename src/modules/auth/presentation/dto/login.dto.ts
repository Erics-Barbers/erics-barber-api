import { IsEmail, Length } from 'class-validator';

export class LoginDto {
  @IsEmail()
  readonly email: string;

  @Length(8, 20)
  readonly password: string;
}
