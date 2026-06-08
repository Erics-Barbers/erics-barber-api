import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../infrastructure/services/jwt.service';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    const decoded = await this.checkTokenIsValid(refreshToken);
    const user = await this.authService.findUserById(decoded.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.tokenService.signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role ?? undefined,
        tokenType: 'access',
      },
      { expiresIn: '15m' },
    );

    return { accessToken };
  }

  async checkTokenIsValid(
    refreshToken: string,
  ): Promise<RefreshTokenPayload & { sub: string }> {
    const decoded = (await this.tokenService.verifyToken(
      refreshToken,
    )) as RefreshTokenPayload | null;

    if (!decoded?.sub || decoded.tokenType !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessions = await this.authService.findSessionsByUserId(decoded.sub);
    const matchingSession = await Promise.any(
      sessions.map(async (session) => {
        const isTokenValid = await this.bcryptService.compareHashedInput(
          refreshToken,
          session.refreshToken,
        );

        if (!isTokenValid) {
          throw new Error('Session does not match refresh token');
        }

        return session;
      }),
    ).catch(() => null);

    if (!matchingSession) {
      throw new UnauthorizedException(
        'Session not found or refresh token invalid',
      );
    }

    return decoded as RefreshTokenPayload & { sub: string };
  }
}
