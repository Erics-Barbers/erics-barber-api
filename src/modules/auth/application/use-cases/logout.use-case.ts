import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../infrastructure/services/jwt.service';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    const decoded = this.tokenService.decodeToken(
      refreshToken,
    ) as RefreshTokenPayload;

    if (!decoded || !decoded.sub || decoded.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.authService.invalidateRefreshToken(decoded.sub, refreshToken);
  }
}
