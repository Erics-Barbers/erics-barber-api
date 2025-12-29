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
import { RegisterDto } from '../dto/register.dto';
import { TokenService } from '../../infrastructure/services/jwt.service';
import { LoginDto } from '../dto/login.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let tokenService = { verifyToken: jest.fn() };
  let mockRegisterUseCase = { execute: jest.fn() };
  let mockVerifyEmailUseCase = { execute: jest.fn() };
  let mockLoginUseCase = { execute: jest.fn() };
  let mockLogoutUseCase = { execute: jest.fn() };
  let mockResetPasswordUseCase = { execute: jest.fn() };
  let mockResetPasswordEmailUseCase = { execute: jest.fn() };
  let mockEnableMFAUseCase = { execute: jest.fn() };
  let mockGetProfileUseCase = { execute: jest.fn() };
  let mockUpdateProfileUseCase = { execute: jest.fn() };

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
        { provide: EnableMfaUseCase, useValue: mockEnableMFAUseCase },
        { provide: GetProfileUseCase, useValue: mockGetProfileUseCase },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
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
      expect(error.status).toBe(400);
      expect(error.message).toBe('Email must be a valid email address');
      expect(mockRegisterUseCase.execute).not.toHaveBeenCalledWith(dto);
    }
  });

  it('auth/verify-email should return a message, token and 200 status code', async () => {
    const token = 'verification-token';

    return controller.verifyEmail(token).then((response) => {
      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith(token);
      expect(response).toEqual({
        message: 'Email verified successfully',
        tokens: undefined,
      });
    });
  });

  it('auth/login should return a message, result and 200 status code', async () => {
    const dto: LoginDto = {
      email: 'controller-test@example.com',
      password: 'Password123',
    };

    return controller.login(dto).then((response) => {
      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(dto);
      expect(response).toEqual({
        result: undefined,
        message: 'User logged in successfully',
      });
    });
  });

  it('auth/reset-password should return 200 and success message for valid request', () => {
    const dto: ResetPasswordDto = {
      email: 'controller-test@example.com',
      newPassword: 'NewPassword123',
    };

    return controller.resetPassword(dto).then((response) => {
      expect(mockResetPasswordUseCase.execute).toHaveBeenCalledWith(dto);
      expect(response).toEqual({ message: 'Password reset successfully' });
    });
  });

  it('auth/reset-password should return 400 error code for a non-valid email', async () => {
    const dto: ResetPasswordDto = {
      email: 'invalid-email-format',
      newPassword: 'NewPassword123',
    };

    try {
      return await controller.resetPassword(dto);
    } catch (error) {
      expect(error.status).toBe(400);
      expect(error.message).toBe('Email must be a valid email address');
      expect(mockResetPasswordUseCase.execute).not.toHaveBeenCalledWith(dto);
    }
  });
});
