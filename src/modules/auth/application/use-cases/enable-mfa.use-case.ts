import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class EnableMfaUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, mfaSecret: string): Promise<void> {
    await this.authService.enableMfa(userId, mfaSecret);
  }
}
