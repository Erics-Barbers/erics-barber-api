import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcrypt';

@Injectable()
export class BcryptService {
  private readonly saltRounds = 10;

  async hashInput(password: string): Promise<string> {
    return hash(password, this.saltRounds);
  }

  async compareHashedInput(
    input: string,
    hashedInput: string,
  ): Promise<boolean> {
    return compare(input, hashedInput);
  }
}
