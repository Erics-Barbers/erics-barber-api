import { ResetPasswordDto } from 'src/modules/auth/presentation/dto/reset-password.dto';
import { ResetPasswordUseCase } from '../reset-password.use-case';
import { UnauthorizedException } from '@nestjs/common';

describe('ResetPasswordUseCase', () => {
  let resetPasswordUseCase: ResetPasswordUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      resetPassword: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
    };
    resetPasswordUseCase = new ResetPasswordUseCase(authService, tokenService);
  });

  it('should reset password successfully', async () => {
    const dto: ResetPasswordDto = {
      token: 'password-reset-token',
      newPassword: 'NewPassword1',
    };
    tokenService.verifyToken.mockResolvedValue({
      email: 'test@example.com',
      tokenType: 'passwordReset',
    });
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
