import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { TokenService } from '../../infrastructure/services/jwt-token.service';
import { AuthResponseDto } from '../../presentation/dto/auth-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService,
    readonly tokenService: TokenService,
  ) {}

  async execute(email: string, password: string): Promise<AuthResponseDto> {
    const existingUser = await this.authService.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await this.bcryptService.hashPassword(password);
    const data = { email, hashedPassword };
    await this.authService.createUser(data);

    const tokens = await this.tokenService.generateTokens(email);
    return AuthResponseDto.create(tokens);
  }
}
