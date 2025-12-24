import { Injectable } from '@nestjs/common';
import { TokenService } from '../../infrastructure/services/jwt-token.service';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}
  async execute(token: string): Promise<AuthResponseDto> {
    const payload = await this.tokenService.verifyToken(token);
    if (!payload || !payload.email) {
      throw new Error('Invalid or expired token');
    }

    const user = await this.authService.findUserByEmail(
      payload.email as string,
    );
    if (!user) {
      throw new Error('User not found');
    }

    await this.authService.markEmailAsVerified(user.id);
    const tokens = await this.tokenService.issueTokens({ id: user.id, email: user.email });
    return AuthResponseDto.create(tokens);
  }
}
