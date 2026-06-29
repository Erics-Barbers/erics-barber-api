import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class AccountLookupDto {
  @ApiProperty({
    description: 'Email address to check for an existing account.',
    example: 'customer@example.com',
  })
  @IsEmail()
  readonly email!: string;
}

export class AccountLookupResponseDto {
  @ApiProperty({
    description: 'Whether an account exists for the submitted email.',
    example: true,
  })
  readonly exists!: boolean;
}
