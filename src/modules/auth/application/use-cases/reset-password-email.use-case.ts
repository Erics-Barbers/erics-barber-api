import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from '../../infrastructure/services/jwt-token.service';

@Injectable()
export class ResetPasswordEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.authService.findUserByEmail(email);
    if (user) {
      const token = await this.tokenService.generateTokens(email);
      await this.authService.sendResetPasswordEmail(email, token.accessToken);
    }
  }
}
