import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { RefreshTokenRequestDto } from '../../presentation/dto/refresh-token.dto';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(
    dto: RefreshTokenRequestDto,
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    await this.checkTokenIsValid(dto, refreshToken);
    const accessToken = await this.tokenService.signToken(
      { sub: dto.userId, email: dto.email, tokenType: 'access' },
      { expiresIn: '15m' },
    );
    return { accessToken };
  }

  async checkTokenIsValid(dto: RefreshTokenRequestDto, refreshToken: string) {
    const hashedToken = await this.bcryptService.hashInput(refreshToken);
    const session = await this.authService.findSession(hashedToken);
    if (!session) {
      throw new UnauthorizedException(
        'Session not found or refresh token invalid',
      );
    }
    const isTokenValid = await this.bcryptService.compareHashedInput(
      session.refreshToken,
      refreshToken,
    );
    if (!isTokenValid) {
      await this.authService.invalidateRefreshToken(
        dto.userId,
        session.refreshToken,
      );

      throw new UnauthorizedException('Refresh token is invalid');
    }
  }
}
