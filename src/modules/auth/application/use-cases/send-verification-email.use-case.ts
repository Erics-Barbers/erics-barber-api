import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { ResendService } from 'src/infrastructure/mail/resend.service';

@Injectable()
export class SendVerificationEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly resendService: ResendService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.authService.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const clientBaseUrl = process.env.CLIENT_BASE_URL;
    const token = await this.tokenService.generateTokens(user.email);
    const subject = 'Verify Your Email';
    const verificationLink = `${clientBaseUrl}/email-verify?token=${token.accessToken}`;
    const emailContent = `
      <h1>Email Verification</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
    `;
    await this.resendService.sendEmail(user.email, subject, emailContent);
  }
}
