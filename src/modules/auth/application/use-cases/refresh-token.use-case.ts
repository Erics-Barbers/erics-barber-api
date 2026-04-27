import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { RefreshTokenDto } from '../../presentation/dto/refresh-token.dto';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
  ) {}

  async execute(
    dto: RefreshTokenDto,
    refreshToken: string,
  ): Promise<AuthResponseDto> {
    await this.checkTokenIsValid(dto, refreshToken);
    const tokens = await this.rotateRefreshToken(dto, refreshToken);
    return tokens;
  }

  async checkTokenIsValid(dto: RefreshTokenDto, refreshToken: string) {
    const hashedToken = await this.bcryptService.hashInput(refreshToken);
    const session = await this.authService.findSession(dto.userId, hashedToken);
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

  async rotateRefreshToken(dto: RefreshTokenDto, refreshToken: string) {
    const hashedToken = await this.bcryptService.hashInput(refreshToken);
    const user = { id: dto.userId, email: dto.email };
    await this.authService.invalidateRefreshToken(dto.userId, hashedToken);
    const tokens = await this.tokenService.issueTokens(user);
    const decoded: any = this.tokenService.decodeToken(tokens.refreshToken);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const expiresAt = new Date(decoded.exp * 1000);
    const sessionData: SessionCreateInput = {
      user: { connect: { id: user.id } },
      refreshToken: hashedToken,
      expiresAt,
    };
    await this.authService.createSession(sessionData);

    return tokens;
  }
}
