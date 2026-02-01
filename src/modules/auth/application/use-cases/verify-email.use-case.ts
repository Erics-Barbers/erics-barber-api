import { Injectable } from '@nestjs/common';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(token: string): Promise<AuthResponseDto> {
    const payload = await this.verifyToken(token);
    const user = await this.markEmailAsVerified(payload.email as string);
    return this.issueTokens({ id: user.id, email: user.email });
  }

  async verifyToken(token: string): Promise<Record<string, unknown>> {
    const payload = await this.tokenService.verifyToken(token);
    if (!payload || !payload.email) {
      throw new Error('Invalid or expired token');
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

  async issueTokens(user: { id: string; email: string }) {
    const tokens = await this.tokenService.issueTokens(user);
    return AuthResponseDto.create(tokens);
  }
}
