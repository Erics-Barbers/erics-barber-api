import { ResetPasswordEmailUseCase } from '../reset-password-email.use-case';

describe('ResetPasswordEmailUseCase', () => {
  let resetPasswordEmailUseCase: ResetPasswordEmailUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
    };
    tokenService = {
      issuePasswordResetToken: jest.fn(),
    };
    resetPasswordEmailUseCase = new ResetPasswordEmailUseCase(
      authService,
      tokenService,
    );
  });

  it('should send reset password email if user exists', async () => {
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
    };
    authService.findUserByEmail.mockResolvedValue(mockUser);
    tokenService.issuePasswordResetToken.mockResolvedValue(
      'password-reset-token',
    );
    await resetPasswordEmailUseCase.execute(mockUser.email);
    expect(authService.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(tokenService.issuePasswordResetToken).toHaveBeenCalledWith(
      mockUser.email,
    );
    expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
      mockUser.email,
      'password-reset-token',
    );
  });

  it('should not send email if user does not exist', async () => {
    authService.findUserByEmail.mockResolvedValue(null);
    await resetPasswordEmailUseCase.execute('test@example.com');
    expect(authService.findUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(tokenService.issuePasswordResetToken).not.toHaveBeenCalled();
    expect(authService.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});
