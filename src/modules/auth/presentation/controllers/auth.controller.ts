import { Body, Controller, Post } from '@nestjs/common';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { EnableMfaUseCase } from '../../application/use-cases/enable-mfa.use-case';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly enableMFAUseCase: EnableMfaUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    this.registerUseCase.execute(dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.loginUseCase.execute(dto.email, dto.password);
  }

  @Post('reset-password')
  async resetPassword() {
    // Reset password logic here
  }

  @Post('verify-mfa')
  async verifyMFA() {
    // Enable MFA logic here
  }
}
