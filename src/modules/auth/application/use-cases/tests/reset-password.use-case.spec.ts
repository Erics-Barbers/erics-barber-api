import { ResetPasswordDto } from 'src/modules/auth/presentation/dto/reset-password.dto';
import { ResetPasswordUseCase } from '../reset-password.use-case';

describe('ResetPasswordUseCase', () => {
  let resetPasswordUseCase: ResetPasswordUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      resetPassword: jest.fn(),
    };
    resetPasswordUseCase = new ResetPasswordUseCase(authService);
  });

  it('should reset password successfully', async () => {
    const dto: ResetPasswordDto = {
      email: 'test@example.com',
      newPassword: 'NewPassword1',
    };
    authService.resetPassword.mockResolvedValue(undefined);
    await resetPasswordUseCase.execute(dto);
    expect(authService.resetPassword).toHaveBeenCalledWith(
      'test@example.com',
      'NewPassword1',
    );
  });
});
