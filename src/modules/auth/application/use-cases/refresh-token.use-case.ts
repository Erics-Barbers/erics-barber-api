import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, refreshToken: string): Promise<void> {
    await this.authService.invalidateRefreshToken(userId, refreshToken);
  }
}
