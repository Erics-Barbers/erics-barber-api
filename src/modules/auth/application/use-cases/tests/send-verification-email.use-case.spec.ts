import { SendVerificationEmailUseCase } from '../send-verification-email.use-case';

describe('SendVerificationEmailUseCase', () => {
  let sendVerificationEmailUseCase: SendVerificationEmailUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
    };
    sendVerificationEmailUseCase = new SendVerificationEmailUseCase(authService, tokenService);
  });

  it('should send a verification email when user exists', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    authService.findUserByEmail.mockResolvedValue(mockUser);
    tokenService.generateTokens.mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' });
    authService.sendVerificationEmail.mockResolvedValue(undefined);

    await sendVerificationEmailUseCase.execute('test@example.com');

    expect(authService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(tokenService.generateTokens).toHaveBeenCalledWith(mockUser.email);
    expect(authService.sendVerificationEmail).toHaveBeenCalledWith(mockUser.email, 'token');
  });

  it('should throw an error when user does not exist', async () => {
    authService.findUserByEmail.mockResolvedValue(null);

    await expect(
      sendVerificationEmailUseCase.execute('nonexistent@example.com'),
    ).rejects.toThrow('User not found');

    expect(tokenService.generateTokens).not.toHaveBeenCalled();
    expect(authService.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('should use the access token (not refresh token) in the verification email', async () => {
    const mockUser = { id: 'user-1', email: 'test@example.com' };
    authService.findUserByEmail.mockResolvedValue(mockUser);
    tokenService.generateTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    authService.sendVerificationEmail.mockResolvedValue(undefined);

    await sendVerificationEmailUseCase.execute('test@example.com');

    expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
      mockUser.email,
      'access-token',
    );
  });
});
