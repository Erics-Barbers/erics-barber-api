import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../infrastructure/services/jwt.service';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';
import { Session } from 'src/generated/prisma/client';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(
    refreshToken: string,
    userAgent?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { decoded, matchingSession } =
      await this.checkTokenIsValid(refreshToken);
    const user = await this.authService.findUserById(decoded.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.tokenService.issueTokens(user);
    const refreshPayload = this.tokenService.decodeToken(
      tokens.refreshToken,
    ) as RefreshTokenPayload | null;

    if (!refreshPayload?.exp) {
      throw new UnauthorizedException('Invalid rotated refresh token');
    }

    const hashedRefreshToken = await this.bcryptService.hashInput(
      tokens.refreshToken,
    );
    const sessionData: SessionCreateInput = {
      user: { connect: { id: user.id } },
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(refreshPayload.exp * 1000),
      userAgent,
    };

    await this.authService.rotateRefreshTokenSession(
      matchingSession.id,
      sessionData,
    );

    return tokens;
  }

  async checkTokenIsValid(refreshToken: string): Promise<{
    decoded: RefreshTokenPayload & { sub: string };
    matchingSession: Session;
  }> {
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

    return {
      decoded: decoded as RefreshTokenPayload & { sub: string },
      matchingSession,
    };
  }
}
