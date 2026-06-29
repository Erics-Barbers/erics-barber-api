import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class AccountLookupUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(email: string): Promise<{ exists: boolean }> {
    const user = await this.authService.findUserByEmail(email);
    return { exists: Boolean(user) };
  }
}
