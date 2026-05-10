jest.mock('src/infrastructure/mail/resend.service');

import { VerifyEmailUseCase } from '../verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let verifyEmailUseCase: VerifyEmailUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

  const mockUser = { id: 'userId', email: 'test@example.com', isEmailVerified: false };
  const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      markEmailAsVerified: jest.fn(),
      createSession: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
    };
    verifyEmailUseCase = new VerifyEmailUseCase(authService, tokenService, bcryptService);
  });

  it('should verify email successfully and return tokens', async () => {
    const mockPayload = { email: 'test@example.com', iat: 0, exp: 9999999999 };
    const expiresAt = Math.floor(Date.now() / 1000) + 604800;

    tokenService.verifyToken.mockResolvedValue(mockPayload);
    authService.findUserByEmail.mockResolvedValue(mockUser);
    authService.markEmailAsVerified.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue(mockTokens);
    tokenService.decodeToken.mockReturnValue({ exp: expiresAt });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    authService.createSession.mockResolvedValue(undefined);

    const result = await verifyEmailUseCase.execute('valid-token', 'Mozilla/5.0');

    expect(tokenService.verifyToken).toHaveBeenCalledWith('valid-token');
    expect(authService.findUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(authService.markEmailAsVerified).toHaveBeenCalledWith(mockUser.id);
    expect(tokenService.issueTokens).toHaveBeenCalledWith({ id: mockUser.id, email: mockUser.email });
    expect(result).toHaveProperty('accessToken', 'access-token');
  });

  it('should throw an error if token is invalid or expired', async () => {
    tokenService.verifyToken.mockResolvedValue(null);

    await expect(
      verifyEmailUseCase.execute('invalid-token', 'Mozilla/5.0'),
    ).rejects.toThrow('Invalid or expired token');
  });

  it('should throw an error if user is not found', async () => {
    tokenService.verifyToken.mockResolvedValue({ email: 'test@example.com', iat: 0, exp: 9999999999 });
    authService.findUserByEmail.mockResolvedValue(null);

    await expect(
      verifyEmailUseCase.execute('valid-token', 'Mozilla/5.0'),
    ).rejects.toThrow('User not found');
  });

  it('should create a session after email verification', async () => {
    const mockPayload = { email: 'test@example.com', iat: 0, exp: 9999999999 };
    const expiresAt = Math.floor(Date.now() / 1000) + 604800;

    tokenService.verifyToken.mockResolvedValue(mockPayload);
    authService.findUserByEmail.mockResolvedValue(mockUser);
    authService.markEmailAsVerified.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue(mockTokens);
    tokenService.decodeToken.mockReturnValue({ exp: expiresAt });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    authService.createSession.mockResolvedValue(undefined);

    await verifyEmailUseCase.execute('valid-token', 'Mozilla/5.0');

    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { connect: { id: mockUser.id } },
        refreshToken: 'hashed-refresh-token',
        userAgent: 'Mozilla/5.0',
      }),
    );
  });
});
