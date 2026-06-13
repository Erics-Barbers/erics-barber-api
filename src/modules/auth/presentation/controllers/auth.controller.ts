import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { EnableMfaUseCase } from '../../application/use-cases/enable-mfa.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordEmailUseCase } from '../../application/use-cases/reset-password-email.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { SendVerificationEmailUseCase } from '../../application/use-cases/send-verification-email.use-case';

import { LoginRequestDto, LoginResponseDto } from '../dto/login.dto';
import { MfaDto } from '../dto/mfa.dto';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import {
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from '../dto/verify-email.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { ResetPasswordEmailDto } from '../dto/reset-password-email.dto';
import { RefreshTokenResponseDto } from '../dto/refresh-token.dto';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { UserAgent } from 'src/common/decorators/user-agent.decorator';
import { Request, Response } from 'express';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserProfile } from 'src/common/types/profile';
import { AuthLoggingInterceptor } from '../interceptors/auth-logging.interceptor';

const ONE_MINUTE = 60_000;
const ONE_HOUR = 60 * 60_000;

@Controller('auth')
@UseInterceptors(AuthLoggingInterceptor)
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
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'User registered successfully',
  })
  @Throttle({ default: { limit: 5, ttl: ONE_MINUTE } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    await this.registerUseCase.execute(dto);
    return {
      message:
        'User registered successfully. Check your email for verification link.',
    };
  }

  @HttpCode(200)
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
  })
  @Throttle({ default: { limit: 3, ttl: ONE_HOUR } })
  @Post('send-verification-email')
  async sendVerificationEmail(@Body() dto: SendVerificationDto) {
    await this.sendVerificationEmailUseCase.execute(dto.email);
    return { message: 'Verification email sent successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: ONE_MINUTE } })
  @Post('verify-email')
  async verifyEmail(
    @UserAgent() userAgent: string,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: VerifyEmailRequestDto,
  ): Promise<VerifyEmailResponseDto> {
    const { accessToken, refreshToken } = await this.verifyEmailUseCase.execute(
      dto.token,
      userAgent,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      message: 'Email verified successfully',
      accessToken,
      refreshToken,
    };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User logged in successfully',
    type: LoginResponseDto,
  })
  @Throttle({ default: { limit: 10, ttl: ONE_MINUTE } })
  @Post('login')
  async login(
    @UserAgent() userAgent: string,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequestDto,
  ): Promise<LoginResponseDto> {
    const { accessToken, refreshToken } = await this.loginUseCase.execute(
      dto,
      userAgent,
    );
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return {
      accessToken,
      refreshToken,
      message: 'User logged in successfully',
    };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User profile retrieved successfully',
  })
  @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() userId: string) {
    return await this.getProfileUseCase.execute(userId);
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User profile updated successfully',
  })
  @UseGuards(AuthGuard)
  @Put('profile')
  async updateProfile(
    @CurrentUser() userId: string,
    @Body() profileData: UserProfile,
  ) {
    return await this.updateProfileUseCase.execute(userId, profileData);
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'User logged out successfully',
  })
  @Throttle({ default: { limit: 30, ttl: ONE_MINUTE } })
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'] as string;
    await this.logoutUseCase.execute(refreshToken);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      path: '/auth',
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { message: 'User logged out successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Password reset link sent to email if it exists',
  })
  @Throttle({ default: { limit: 3, ttl: ONE_HOUR } })
  @Post('reset-password-email')
  async resetPasswordEmail(@Body() dto: ResetPasswordEmailDto) {
    await this.resetPasswordEmailUseCase.execute(dto.email);
    return { message: 'Password reset link sent to email if it exists' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Password reset successfully',
  })
  @Throttle({ default: { limit: 10, ttl: ONE_MINUTE } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute(dto);
    return { message: 'Password reset successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'MFA enabled successfully',
  })
  @Throttle({ default: { limit: 10, ttl: ONE_MINUTE } })
  @Post('verify-mfa')
  async verifyMFA(@Body() dto: MfaDto) {
    await this.enableMFAUseCase.execute(dto);
    return { message: 'MFA enabled successfully' };
  }

  @HttpCode(200)
  @ApiOkResponse({
    description: 'Access token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @Throttle({ default: { limit: 30, ttl: ONE_MINUTE } })
  @Post('refresh')
  async refreshTokens(
    @UserAgent() userAgent: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResponseDto> {
    const oldRefreshToken = req.cookies['refreshToken'] as string;
    const { accessToken, refreshToken } =
      await this.refreshTokenUseCase.execute(oldRefreshToken, userAgent);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/auth',
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken,
      refreshToken,
      message: 'Access token refreshed successfully',
    };
  }
}
