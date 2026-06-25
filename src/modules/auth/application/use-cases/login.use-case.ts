import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenPair,
  TokenService,
} from 'src/modules/auth/infrastructure/services/jwt.service';
import {
  LoginMfaRequiredResponseDto,
  LoginRequestDto,
} from '../../presentation/dto/login.dto';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';
import { MfaMethod, User } from 'src/generated/prisma/client';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';

const MFA_CODE_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(
    dto: LoginRequestDto,
    userAgent: string,
  ): Promise<TokenPair | LoginMfaRequiredResponseDto> {
    const user = await this.validateUserCredentials(dto);
    const rememberMe = dto.rememberMe ?? false;

    if (user.mfaEnabled) {
      return await this.createMfaChallenge(user, rememberMe);
    }

    const tokens = await this.issueTokens(user, userAgent, rememberMe);
    return tokens;
  }

  async validateUserCredentials(dto: LoginRequestDto) {
    const user = await this.authService.validateUserCredentials(
      dto.email,
      dto.password,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    return user;
  }

  async issueTokens(
    user: User,
    userAgent: string,
    rememberMe: boolean,
  ): Promise<TokenPair> {
    const tokens = await this.tokenService.issueTokens(user, { rememberMe });
    const decoded = this.tokenService.decodeToken(
      tokens.refreshToken,
    ) as RefreshTokenPayload | null;

    if (!decoded?.exp) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const expiresAt = new Date(decoded.exp * 1000);
    const hashedRefreshToken = await this.bcryptService.hashInput(
      tokens.refreshToken,
    );
    const sessionData: SessionCreateInput = {
      user: { connect: { id: user.id } },
      refreshToken: hashedRefreshToken,
      expiresAt,
      userAgent,
      rememberMe,
    };

    await this.authService.createSession(sessionData);
    return tokens;
  }

  private async createMfaChallenge(
    user: User,
    rememberMe: boolean,
  ): Promise<LoginMfaRequiredResponseDto> {
    const code = this.generateMfaCode();
    const codeHash = await this.bcryptService.hashInput(code);
    const method = user.mfaMethod ?? MfaMethod.EMAIL;
    const challenge = await this.authService.createMfaChallenge({
      userId: user.id,
      codeHash,
      method,
      rememberMe,
      expiresAt: new Date(Date.now() + MFA_CODE_TTL_MS),
    });

    await this.authService.sendMfaCodeEmail(user.email, code);

    return {
      message: 'MFA required',
      code: 'MFA_REQUIRED',
      mfaRequired: true,
      challengeId: challenge.id,
      mfaMethod: method,
    };
  }

  private generateMfaCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
