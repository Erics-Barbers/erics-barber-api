import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';
import { LoginDto } from '../../presentation/dto/login.dto';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.authService.validateUserCredentials(
      dto.email,
      dto.password,
    );

    if (!user) throw new UnauthorizedException();
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    return await this.tokenService.issueTokens(user);
  }
}
