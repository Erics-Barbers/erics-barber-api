import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { ResetPasswordDto } from '../../presentation/dto/reset-password.dto';
import {
  PasswordResetTokenPayload,
  TokenService,
} from '../../infrastructure/services/jwt.service';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: ResetPasswordDto): Promise<void> {
    const payload = await this.verifyToken(dto.token);
    await this.authService.resetPassword(payload.email, dto.newPassword);
  }

  async verifyToken(token: string): Promise<PasswordResetTokenPayload> {
    const payload = (await this.tokenService.verifyToken(
      token,
    )) as PasswordResetTokenPayload | null;

    if (!payload || !payload.email || payload.tokenType !== 'passwordReset') {
      throw new UnauthorizedException(
        'Invalid or expired password reset token',
      );
    }

    return payload;
  }
}
