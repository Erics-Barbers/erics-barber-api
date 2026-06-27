import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class DeleteAccountUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string): Promise<void> {
    await this.authService.softDeleteAccount(userId);
  }
}
