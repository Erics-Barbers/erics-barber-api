import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';
import { LoginRequestDto } from '../../presentation/dto/login.dto';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';
import { User } from 'src/generated/prisma/client';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';

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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.validateUserCredentials(dto);
    const tokens = await this.issueTokens(user, userAgent);
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
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokens = await this.tokenService.issueTokens(user);
    const decoded: any = this.tokenService.decodeToken(tokens.refreshToken);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const expiresAt = new Date(decoded.exp * 1000);
    const hashedRefreshToken = await this.bcryptService.hashInput(
      tokens.refreshToken,
    );
    const sessionData: SessionCreateInput = {
      user: { connect: { id: user.id } },
      refreshToken: hashedRefreshToken,
      expiresAt,
      userAgent,
    };

    await this.authService.createSession(sessionData);
    return tokens;
  }
}
