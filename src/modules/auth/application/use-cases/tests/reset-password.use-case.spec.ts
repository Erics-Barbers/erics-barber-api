import { ResetPasswordDto } from 'src/modules/auth/presentation/dto/reset-password.dto';
import { ResetPasswordUseCase } from '../reset-password.use-case';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  PasswordResetTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';

describe('ResetPasswordUseCase', () => {
  let resetPasswordUseCase: ResetPasswordUseCase;
  let authService: jest.Mocked<Pick<AuthService, 'resetPassword'>>;
  let tokenService: jest.Mocked<Pick<TokenService, 'verifyToken'>>;

  beforeEach(() => {
    authService = {
      resetPassword: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
    };
    resetPasswordUseCase = new ResetPasswordUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
    );
  });

  it('should reset password successfully', async () => {
    const dto: ResetPasswordDto = {
      token: 'password-reset-token',
      newPassword: 'NewPassword1',
    };
    const payload: PasswordResetTokenPayload = {
      email: 'test@example.com',
      tokenType: 'passwordReset',
      iat: 0,
      exp: 1,
    };
    tokenService.verifyToken.mockResolvedValue(payload);
    authService.resetPassword.mockResolvedValue(undefined);
    await resetPasswordUseCase.execute(dto);
    expect(tokenService.verifyToken).toHaveBeenCalledWith(
      'password-reset-token',
    );
    expect(authService.resetPassword).toHaveBeenCalledWith(
      'test@example.com',
      'NewPassword1',
    );
  });

  it('should reject invalid or wrong-purpose reset tokens', async () => {
    tokenService.verifyToken.mockResolvedValue({
      email: 'test@example.com',
      tokenType: 'access',
      iat: 0,
      exp: 1,
    });

    await expect(
      resetPasswordUseCase.execute({
        token: 'access-token',
        newPassword: 'NewPassword1',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});
