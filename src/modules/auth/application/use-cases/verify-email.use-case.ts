import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  EmailVerificationTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../infrastructure/services/jwt.service';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';
import { User } from 'src/generated/prisma/client';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { BookingService } from 'src/modules/booking/infrastructure/prisma/booking.prisma-repository';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly bcryptService: BcryptService,
    private readonly bookingService: BookingService,
  ) {}

  async execute(token: string, userAgent: string): Promise<AuthResponseDto> {
    const payload = await this.verifyToken(token);
    const user = await this.markEmailAsVerified(payload.email);
    await this.bookingService.linkGuestBookingsToUser(user.id, user.email);
    return await this.issueTokens(user, userAgent);
  }

  async verifyToken(token: string): Promise<EmailVerificationTokenPayload> {
    const payload = (await this.tokenService.verifyToken(
      token,
    )) as EmailVerificationTokenPayload | null;
    if (
      !payload ||
      !payload.email ||
      payload.tokenType !== 'emailVerification'
    ) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }
    return payload;
  }

  async markEmailAsVerified(email: string): Promise<User> {
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    await this.authService.markEmailAsVerified(user.id);
    return user;
  }

  async issueTokens(user: User, userAgent: string) {
    const tokens = await this.tokenService.issueTokens(user);
    const decoded = this.tokenService.decodeToken(
      tokens.refreshToken,
    ) as RefreshTokenPayload;
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
    return AuthResponseDto.create(tokens);
  }
}
