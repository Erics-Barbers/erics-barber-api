import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from '../../infrastructure/services/jwt.service';

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    await this.sendVerificationEmail(user.email);
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const token = await this.tokenService.issueEmailVerificationToken(email);
    await this.authService.sendVerificationEmail(email, token);
  }
}
