import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { TokenService } from '../../infrastructure/services/jwt-token.service';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';
import { RegisterDto } from '../../presentation/dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService,
    readonly tokenService: TokenService,
  ) {}

  async execute(data: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.authService.findUserByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await this.bcryptService.hashPassword(
      data.passwordHash,
    );
    const hashedData = { email: data.email, passwordHash: hashedPassword };
    await this.authService.createUser(hashedData);

    const tokens = await this.tokenService.generateTokens(data.email);
    await this.authService.sendVerificationEmail(
      data.email,
      tokens.accessToken,
    );
    return AuthResponseDto.create(tokens);
  }
}
