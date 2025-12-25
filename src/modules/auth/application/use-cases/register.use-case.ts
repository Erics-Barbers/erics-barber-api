import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../infrastructure/services/bcrypt.service';
import { TokenService } from '../../infrastructure/services/jwt-token.service';
import { RegisterDto } from '../../presentation/dto/register.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly authService: AuthService,
    private readonly bcryptService: BcryptService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(data: RegisterDto): Promise<void> {
    await this.checkIfEmailIsInUse(data.email);
    await this.storeUserCredentials(data);

    const tokens = await this.tokenService.generateTokens(data.email);
    await this.authService.sendVerificationEmail(
      data.email,
      tokens.accessToken,
    );
    return;
  }

  async checkIfEmailIsInUse(email: string): Promise<boolean> {
    const existingUser = await this.authService.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    return false;
  }

  async storeUserCredentials(data: RegisterDto): Promise<void> {
    const hashedPassword = await this.bcryptService.hashPassword(
      data.passwordHash,
    );
    const hashedData = { email: data.email, passwordHash: hashedPassword };
    await this.authService.createUser(hashedData);
  }
}
