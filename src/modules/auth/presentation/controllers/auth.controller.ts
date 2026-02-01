import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';

import { EnableMfaUseCase } from '../../application/use-cases/enable-mfa.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordEmailUseCase } from '../../application/use-cases/reset-password-email.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { SendVerificationEmailUseCase } from '../../application/use-cases/send-verification-email.use-case';

import { LoginDto } from '../dto/login.dto';
import { LogOutDto } from '../dto/logout.dto';
import { MfaDto } from '../dto/mfa.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';

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
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
  ) {}

  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'User registered successfully',
  })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.registerUseCase.execute(dto);
    return {
      message:
        'User registered successfully. Check your email for verification link.',
    };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Email verified successfully',
  })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    const tokens = await this.verifyEmailUseCase.execute(token);
    return { message: 'Email verified successfully', tokens };
  }

  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
  })
  @Post('send-verification-email')
  async sendVerificationEmail(@Body('email') email: string) {
    await this.sendVerificationEmailUseCase.execute(email);
    return { message: 'Verification email sent successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User logged in successfully',
  })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    return { result, message: 'User logged in successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile() {
    // TODO: Replace 'userId-placeholder' with actual user ID from auth context
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.getProfileUseCase.execute('userId-placeholder');
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User profile updated successfully',
  })
  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(@Body() profileData: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.updateProfileUseCase.execute(
      'userId-placeholder',
      profileData,
    );
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User logged out successfully',
  })
  @Post('logout')
  async logout(@Body() dto: LogOutDto) {
    await this.logoutUseCase.execute(dto);
    return { message: 'User logged out successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Password reset link sent to email if it exists',
  })
  @Post('reset-password-email')
  async resetPasswordEmail(@Body('email') email: string) {
    await this.resetPasswordEmailUseCase.execute(email);
    return { message: 'Password reset link sent to email if it exists' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Password reset successfully',
  })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Password reset successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'MFA enabled successfully',
  })
  @Post('verify-mfa')
  async verifyMFA(@Body() dto: MfaDto) {
    await this.enableMFAUseCase.execute(dto);
    return { message: 'MFA enabled successfully' };
  }
}
