import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/infrastructure/prisma/auth/auth.repository';

@Injectable()
export class LogoutService {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, refreshToken: string): Promise<void> {
    await this.authService.invalidateRefreshToken(userId, refreshToken);
  }
}
