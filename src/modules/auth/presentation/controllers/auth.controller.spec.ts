import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '../../application/use-cases/register.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';
import { ResetPasswordEmailUseCase } from '../../application/use-cases/reset-password-email.use-case';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { RegisterDto } from '../dto/register.dto';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { LoginRequestDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { PasswordResetSurface } from '../dto/reset-password-email.dto';
import { SendVerificationEmailUseCase } from '../../application/use-cases/send-verification-email.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { VerifyMfaUseCase } from '../../application/use-cases/verify-mfa.use-case';
import { MfaMethod } from 'src/generated/prisma/client';
import { UpdateMfaPreferenceUseCase } from '../../application/use-cases/update-mfa-preference.use-case';
import { Request, Response } from 'express';

type MockResponse = jest.Mocked<Pick<Response, 'cookie' | 'clearCookie'>>;

function createMockRequest(cookies: Record<string, string>): Request {
  return { cookies } as unknown as Request;
}

describe('AuthController', () => {
  let controller: AuthController;
  const tokenService = { verifyToken: jest.fn() };
  const mockRegisterUseCase = { execute: jest.fn() };
  const mockVerifyEmailUseCase = { execute: jest.fn() };
  const mockLoginUseCase = { execute: jest.fn() };
  const mockLogoutUseCase = { execute: jest.fn() };
  const mockResetPasswordUseCase = { execute: jest.fn() };
  const mockResetPasswordEmailUseCase = { execute: jest.fn() };
  const mockVerifyMfaUseCase = { execute: jest.fn() };
  const mockGetProfileUseCase = { execute: jest.fn() };
  const mockUpdateProfileUseCase = { execute: jest.fn() };
  const mockSendVerificationEmailUseCase = { execute: jest.fn() };
  const mockRefreshTokenUseCase = { execute: jest.fn() };
  const mockUpdateMfaPreferenceUseCase = { execute: jest.fn() };
  const mockResponse: MockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };

  beforeEach(async () => {
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
        { provide: VerifyMfaUseCase, useValue: mockVerifyMfaUseCase },
        { provide: GetProfileUseCase, useValue: mockGetProfileUseCase },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
        {
          provide: SendVerificationEmailUseCase,
          useValue: mockSendVerificationEmailUseCase,
        },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenUseCase },
        {
          provide: UpdateMfaPreferenceUseCase,
          useValue: mockUpdateMfaPreferenceUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('auth/register should return a message and 200 status code', () => {
    const dto: RegisterDto = {
      email: 'controller-test@example.com',
      password: 'Password123',
    };
    mockRegisterUseCase.execute.mockResolvedValue(undefined);

    return controller.register(dto).then((response) => {
      expect(response).toEqual({
        message:
          'User registered successfully. Check your email for verification link.',
      });
      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  it('auth/register should return 400 error code for a non-valid email', async () => {
    const dto: RegisterDto = {
      email: 'invalid-email-format',
      password: 'Password123',
    };

    try {
      return await controller.register(dto);
    } catch (error) {
      const httpError = error as { status: number; message: string };

      expect(httpError.status).toBe(400);
      expect(httpError.message).toBe('Email must be a valid email address');
      expect(mockRegisterUseCase.execute).not.toHaveBeenCalledWith(dto);
    }
  });

  it('auth/verify-email should return a message, token and 200 status code', async () => {
    const token = 'verification-token';
    mockVerifyEmailUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });

    return controller
      .verifyEmail('test-agent', mockResponse as unknown as Response, { token })
      .then((response) => {
        expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith(
          token,
          'test-agent',
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          'refresh-token',
          expect.objectContaining({ maxAge: 43_200_000 }),
        );
        expect(response).toEqual({
          message: 'Email verified successfully',
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          refreshMaxAgeSeconds: 43_200,
        });
      });
  });

  it('auth/login should return a message, result and 200 status code', async () => {
    const dto: LoginRequestDto = {
      email: 'controller-test@example.com',
      password: 'Password123',
    };
    mockLoginUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
    });

    return controller
      .login('test-agent', mockResponse as unknown as Response, dto)
      .then((response) => {
        expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
          dto,
          'test-agent',
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          'refresh-token',
          expect.objectContaining({ maxAge: 604_800_000 }),
        );
        expect(response).toEqual({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          refreshMaxAgeSeconds: 604_800,
          message: 'User logged in successfully',
        });
      });
  });

  it('auth/login should return MFA_REQUIRED without setting cookies when MFA is enabled', async () => {
    const dto: LoginRequestDto = {
      email: 'controller-test@example.com',
      password: 'Password123',
    };
    mockLoginUseCase.execute.mockResolvedValue({
      message: 'MFA required',
      code: 'MFA_REQUIRED',
      mfaRequired: true,
      challengeId: 'challenge-id',
      mfaMethod: MfaMethod.EMAIL,
    });

    await expect(
      controller.login('test-agent', mockResponse as unknown as Response, dto),
    ).resolves.toEqual({
      message: 'MFA required',
      code: 'MFA_REQUIRED',
      mfaRequired: true,
      challengeId: 'challenge-id',
      mfaMethod: MfaMethod.EMAIL,
    });

    expect(mockResponse.cookie).not.toHaveBeenCalled();
  });

  it('auth/refresh should rotate refresh token and return new tokens', async () => {
    mockRefreshTokenUseCase.execute.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });

    return controller
      .refreshTokens(
        'test-agent',
        createMockRequest({ refreshToken: 'old-refresh-token' }),
        mockResponse as unknown as Response,
      )
      .then((response) => {
        expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith(
          'old-refresh-token',
          'test-agent',
        );
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'refreshToken',
          'new-refresh-token',
          expect.objectContaining({ maxAge: 43_200_000 }),
        );
        expect(response).toEqual({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          refreshMaxAgeSeconds: 43_200,
          message: 'Access token refreshed successfully',
        });
      });
  });

  it('auth/logout should invalidate refresh token and clear cookie', async () => {
    mockLogoutUseCase.execute.mockResolvedValue(undefined);

    await expect(
      controller.logout(
        createMockRequest({ refreshToken: 'refresh-token' }),
        mockResponse as unknown as Response,
      ),
    ).resolves.toEqual({ message: 'User logged out successfully' });

    expect(mockLogoutUseCase.execute).toHaveBeenCalledWith('refresh-token');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(Object),
    );
  });

  it('auth/logout should succeed and clear cookie when refresh token is missing', async () => {
    mockLogoutUseCase.execute.mockResolvedValue(undefined);

    await expect(
      controller.logout(
        createMockRequest({}),
        mockResponse as unknown as Response,
      ),
    ).resolves.toEqual({ message: 'User logged out successfully' });

    expect(mockLogoutUseCase.execute).toHaveBeenCalledWith(undefined);
    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'refreshToken',
      expect.any(Object),
    );
  });

  it('auth/reset-password should return 200 and success message for valid request', () => {
    const dto: ResetPasswordDto = {
      token: 'password-reset-token',
      newPassword: 'NewPassword123',
    };

    return controller.resetPassword(dto).then((response) => {
      expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith(dto);
      expect(response).toEqual({ message: 'Password reset successfully' });
    });
  });

  it('auth/reset-password-email should request a staff reset link when surface is STAFF', async () => {
    mockResetPasswordEmailUseCase.execute.mockResolvedValue(undefined);

    await expect(
      controller.resetPasswordEmail({
        email: 'barber@example.com',
        surface: PasswordResetSurface.STAFF,
      }),
    ).resolves.toEqual({
      message: 'Password reset link sent to email if it exists',
    });

    expect(mockResetPasswordEmailUseCase.execute).toHaveBeenCalledWith(
      'barber@example.com',
      PasswordResetSurface.STAFF,
    );
  });

  it('auth/reset-password should propagate reset token errors', async () => {
    const dto: ResetPasswordDto = {
      token: 'invalid-token',
      newPassword: 'NewPassword123',
    };
    const error = new Error('Invalid or expired password reset token');
    mockResetPasswordUseCase.execute.mockRejectedValue(error);

    await expect(controller.resetPassword(dto)).rejects.toThrow(error);
    expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('auth/profile should update the current user profile', async () => {
    mockUpdateProfileUseCase.execute.mockResolvedValue({
      id: 'user-id',
      name: 'Updated Name',
      email: 'test@example.com',
      isEmailVerified: true,
    });

    await expect(
      controller.updateProfile('user-id', { name: 'Updated Name' }),
    ).resolves.toEqual({
      id: 'user-id',
      name: 'Updated Name',
      email: 'test@example.com',
      isEmailVerified: true,
    });

    expect(mockUpdateProfileUseCase.execute).toHaveBeenCalledWith('user-id', {
      name: 'Updated Name',
    });
  });

  it('auth/verify-mfa should issue tokens and set refresh cookie', async () => {
    mockVerifyMfaUseCase.execute.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
    });

    await expect(
      controller.verifyMFA('test-agent', mockResponse as unknown as Response, {
        challengeId: 'challenge-id',
        code: '123456',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
      message: 'MFA verified successfully',
    });

    expect(mockVerifyMfaUseCase.execute).toHaveBeenCalledWith(
      {
        challengeId: 'challenge-id',
        code: '123456',
      },
      'test-agent',
    );
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'refresh-token',
      expect.objectContaining({ maxAge: 604_800_000 }),
    );
  });

  it('auth/mfa-preference should update the current user MFA preference', async () => {
    mockUpdateMfaPreferenceUseCase.execute.mockResolvedValue(undefined);

    await expect(
      controller.updateMfaPreference('user-id', {
        enabled: true,
        method: MfaMethod.EMAIL,
      }),
    ).resolves.toEqual({ message: 'MFA preference updated successfully' });

    expect(mockUpdateMfaPreferenceUseCase.execute).toHaveBeenCalledWith(
      'user-id',
      {
        enabled: true,
        method: MfaMethod.EMAIL,
      },
    );
  });
});
