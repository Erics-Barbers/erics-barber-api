import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from 'src/modules/auth/infrastructure/prisma/auth/auth.repository';
import { TokenService } from 'src/modules/auth/infrastructure/services/token/token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string) {
    const user = await this.authService.validateUserCredentials(email, password);

    if (!user) throw new UnauthorizedException();

    return this.tokenService.issueTokens(user);
  }
}

