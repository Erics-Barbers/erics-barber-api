import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.repository';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, refreshToken: string): Promise<void> {
    await this.authService.invalidateRefreshToken(userId, refreshToken);
  }
}
