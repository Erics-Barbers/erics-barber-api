import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { PasswordResetSurface } from '../../presentation/dto/reset-password-email.dto';

@Injectable()
export class ResetPasswordEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    email: string,
    surface: PasswordResetSurface = PasswordResetSurface.CUSTOMER,
  ): Promise<void> {
    const user = await this.authService.findUserByEmail(email);
    if (user) {
      const token = await this.tokenService.issuePasswordResetToken(email);
      await this.authService.sendResetPasswordEmail(email, token, surface);
    }
  }
}
