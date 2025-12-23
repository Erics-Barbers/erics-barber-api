import { Body, Controller, Post } from '@nestjs/common';

import { EnableMfaUseCase } from '../../application/use-cases/enable-mfa.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordEmailUseCase } from '../../application/use-cases/reset-password-email.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';

import { LoginDto } from '../dto/login.dto';
import { LogOutDto } from '../dto/logout.dto';
import { MfaDto } from '../dto/mfa.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly resetPasswordEmailUseCase: ResetPasswordEmailUseCase,
    private readonly enableMFAUseCase: EnableMfaUseCase,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const tokens = await this.registerUseCase.execute(dto);
    return {
      message: 'User registered successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    await this.verifyEmailUseCase.execute(token);
    return { message: 'Email verified successfully' };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    return { result, message: 'User logged in successfully' };
  }

  @Post('logout')
  async logout(@Body() dto: LogOutDto) {
    await this.logoutUseCase.execute(dto);
    return { message: 'User logged out successfully' };
  }

  @Post('reset-password-email')
  async resetPasswordEmail(@Body('email') email: string) {
    await this.resetPasswordEmailUseCase.execute(email);
    return { message: 'Password reset link sent to email if it exists' };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Password reset successfully' };
  }

  @Post('verify-mfa')
  async verifyMFA(@Body() dto: MfaDto) {
    await this.enableMFAUseCase.execute(dto);
    return { message: 'MFA enabled successfully' };
  }
}
