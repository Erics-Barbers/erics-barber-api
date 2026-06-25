import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import {
  RefreshTokenPayload,
  TokenPair,
  TokenService,
} from '../../infrastructure/services/jwt.service';
import { MfaDto } from '../../presentation/dto/mfa.dto';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';

@Injectable()
export class VerifyMfaUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(dto: MfaDto, userAgent: string): Promise<TokenPair> {
    const challenge = await this.authService.findMfaChallengeById(
      dto.challengeId,
    );

    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired MFA challenge');
    }

    const isValidCode = await this.bcryptService.compareHashedInput(
      dto.code,
      challenge.codeHash,
    );

    if (!isValidCode) {
      throw new UnauthorizedException('Invalid MFA code');
    }

    const user = await this.authService.findUserById(challenge.userId);

    if (!user || !user.mfaEnabled) {
      throw new UnauthorizedException('Invalid MFA challenge');
    }

    const rememberMe = challenge.rememberMe;
    const tokens = await this.tokenService.issueTokens(user, { rememberMe });
    const decoded = this.tokenService.decodeToken(
      tokens.refreshToken,
    ) as RefreshTokenPayload | null;

    if (!decoded?.exp) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hashedRefreshToken = await this.bcryptService.hashInput(
      tokens.refreshToken,
    );
    const sessionData: SessionCreateInput = {
      user: { connect: { id: user.id } },
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(decoded.exp * 1000),
      userAgent,
      rememberMe,
    };

    await this.authService.completeMfaChallenge(challenge.id, sessionData);

    return tokens;
  }
}
