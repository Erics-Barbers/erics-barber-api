jest.mock('src/infrastructure/mail/resend.service');

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordEmailUseCase } from '../../application/use-cases/reset-password-email.use-case';
import { EnableMfaUseCase } from '../../application/use-cases/enable-mfa.use-case';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { SendVerificationEmailUseCase } from '../../application/use-cases/send-verification-email.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { RegisterDto } from '../dto/register.dto';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LogOutDto } from '../dto/logout.dto';
import { MfaDto } from '../dto/mfa.dto';
import { SendVerificationDto } from '../dto/send-verification.dto';
import { LoginRequestDto } from '../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const tokenService = { verifyToken: jest.fn() };
  const mockRegisterUseCase = { execute: jest.fn() };
  const mockVerifyEmailUseCase = { execute: jest.fn() };
  const mockLoginUseCase = { execute: jest.fn() };
  const mockLogoutUseCase = { execute: jest.fn() };
  const mockResetPasswordUseCase = { execute: jest.fn() };
  const mockResetPasswordEmailUseCase = { execute: jest.fn() };
  const mockEnableMFAUseCase = { execute: jest.fn() };
  const mockGetProfileUseCase = { execute: jest.fn() };
  const mockUpdateProfileUseCase = { execute: jest.fn() };
  const mockSendVerificationEmailUseCase = { execute: jest.fn() };
  const mockRefreshTokenUseCase = { execute: jest.fn() };

  const mockResponse: any = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: TokenService, useValue: tokenService },
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: VerifyEmailUseCase, useValue: mockVerifyEmailUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: LogoutUseCase, useValue: mockLogoutUseCase },
        { provide: ResetPasswordUseCase, useValue: mockResetPasswordUseCase },
        {
          provide: ResetPasswordEmailUseCase,
          useValue: mockResetPasswordEmailUseCase,
        },
        { provide: EnableMfaUseCase, useValue: mockEnableMFAUseCase },
        { provide: GetProfileUseCase, useValue: mockGetProfileUseCase },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
        {
          provide: SendVerificationEmailUseCase,
          useValue: mockSendVerificationEmailUseCase,
        },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('auth/register should return a message and 201 status code', async () => {
    const dto: RegisterDto = {
      email: 'controller-test@example.com',
      password: 'Password123!',
    };
    mockRegisterUseCase.execute.mockResolvedValue(undefined);

    const response = await controller.register(dto);
    expect(response).toEqual({
      message:
        'User registered successfully. Check your email for verification link.',
    });
    expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('auth/send-verification-email should return a success message', async () => {
    const dto: SendVerificationDto = { email: 'test@example.com' };
    mockSendVerificationEmailUseCase.execute.mockResolvedValue(undefined);

    const response = await controller.sendVerificationEmail(dto);
    expect(response).toEqual({ message: 'Verification email sent successfully' });
    expect(mockSendVerificationEmailUseCase.execute).toHaveBeenCalledWith(dto.email);
  });

  it('auth/verify-email should set refresh token cookie and return access token', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockVerifyEmailUseCase.execute.mockResolvedValue(mockTokens);

    const result = await controller.verifyEmail('Mozilla/5.0', mockResponse, { token: 'verification-token' });

    expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith('verification-token', 'Mozilla/5.0');
    expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
    expect(result).toEqual({ message: 'Email verified successfully', accessToken: 'access-token' });
  });

  it('auth/login should set refresh token cookie and return access token', async () => {
    const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
    mockLoginUseCase.execute.mockResolvedValue(mockTokens);

    const dto: LoginRequestDto = { email: 'test@example.com', password: 'Password123!' };
    const result = await controller.login('Mozilla/5.0', mockResponse, dto);

    expect(mockLoginUseCase.execute).toHaveBeenCalledWith(dto, 'Mozilla/5.0');
    expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
    expect(result).toEqual({ accessToken: 'access-token', message: 'User logged in successfully' });
  });

  it('auth/profile (GET) should return user profile', async () => {
    const mockProfile = { id: 'userId', email: 'test@example.com', name: 'Test' };
    mockGetProfileUseCase.execute.mockResolvedValue(mockProfile);

    const result = await controller.getProfile('userId');
    expect(mockGetProfileUseCase.execute).toHaveBeenCalledWith('userId');
    expect(result).toEqual(mockProfile);
  });

  it('auth/profile (PUT) should update user profile', async () => {
    const mockUpdated = { id: 'userId', name: 'Updated Name' };
    mockUpdateProfileUseCase.execute.mockResolvedValue(mockUpdated);

    const result = await controller.updateProfile('userId', { name: 'Updated Name' } as any);
    expect(mockUpdateProfileUseCase.execute).toHaveBeenCalledWith('userId', { name: 'Updated Name' });
    expect(result).toEqual(mockUpdated);
  });

  it('auth/logout should clear cookie and return success message', async () => {
    const dto: LogOutDto = { refreshToken: 'refresh-token', userId: 'userId' };
    mockLogoutUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.logout(dto, mockResponse);
    expect(mockLogoutUseCase.execute).toHaveBeenCalledWith(dto);
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    expect(result).toEqual({ message: 'User logged out successfully' });
  });

  it('auth/reset-password-email should return success message', async () => {
    mockResetPasswordEmailUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.resetPasswordEmail({ email: 'test@example.com' });
    expect(mockResetPasswordEmailUseCase.execute).toHaveBeenCalledWith('test@example.com');
    expect(result).toEqual({ message: 'Password reset link sent to email if it exists' });
  });

  it('auth/reset-password should return 200 and success message', async () => {
    const dto: ResetPasswordDto = {
      email: 'controller-test@example.com',
      newPassword: 'NewPassword123!',
    };
    mockResetPasswordUseCase.execute.mockResolvedValue(undefined);

    const response = await controller.resetPassword(dto);
    expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith(dto);
    expect(response).toEqual({ message: 'Password reset successfully' });
  });

  it('auth/verify-mfa should return success message', async () => {
    const dto: MfaDto = { userId: 'userId', mfaCode: '123456' };
    mockEnableMFAUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.verifyMFA(dto);
    expect(mockEnableMFAUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ message: 'MFA enabled successfully' });
  });

  it('auth/refresh should set new refresh cookie and return new access token', async () => {
    const mockTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };
    mockRefreshTokenUseCase.execute.mockResolvedValue(mockTokens);

    const mockReq: any = { cookies: { refreshToken: 'old-refresh-token' } };
    const dto = { userId: 'userId', email: 'test@example.com' };

    const result = await controller.refreshTokens(mockReq, dto, mockResponse);

    expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith(dto, 'old-refresh-token');
    expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
    expect(result).toEqual({ accessToken: 'new-access-token', message: 'Access token refreshed successfully' });
  });
});
