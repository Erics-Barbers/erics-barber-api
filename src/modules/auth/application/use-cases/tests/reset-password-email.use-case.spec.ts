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
      generateTokens: jest.fn(),
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
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    await resetPasswordEmailUseCase.execute(mockUser.email);
    expect(authService.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser.email);
    expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
      mockUser.email,
      'access-token',
    );
  });

  it('should not send email if user does not exist', async () => {
    authService.findUserByEmail.mockResolvedValue(null);
    await resetPasswordEmailUseCase.execute('test@example.com');
    expect(authService.findUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(tokenService.generateTokens).not.toHaveBeenCalled();
    expect(authService.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});
