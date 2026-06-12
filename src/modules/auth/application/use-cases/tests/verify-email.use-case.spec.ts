import { VerifyEmailUseCase } from '../verify-email.use-case';
import { UnauthorizedException } from '@nestjs/common';

describe('VerifyEmailUseCase', () => {
  let verifyEmailUseCase: VerifyEmailUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

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
    verifyEmailUseCase = new VerifyEmailUseCase(
      authService,
      tokenService,
      bcryptService,
    );
  });

  it('should verify email successfully and return tokens', async () => {
    const mockPayload = {
      email: 'test@example.com',
      tokenType: 'emailVerification',
    };
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      role: 'CUSTOMER',
      isEmailVerified: false,
    };
    tokenService.verifyToken.mockResolvedValue(mockPayload);
    authService.findUserByEmail.mockResolvedValue(mockUser);
    authService.markEmailAsVerified.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    tokenService.decodeToken.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    const result = await verifyEmailUseCase.execute(
      'valid-token',
      'test-agent',
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
      }),
    );
  });

  it('should reject invalid or wrong-purpose verification tokens', async () => {
    tokenService.verifyToken.mockResolvedValue({
      email: 'test@example.com',
      tokenType: 'access',
    });

    await expect(
      verifyEmailUseCase.execute('access-token', 'test-agent'),
    ).rejects.toThrow(UnauthorizedException);

    expect(authService.markEmailAsVerified).not.toHaveBeenCalled();
    expect(authService.createSession).not.toHaveBeenCalled();
  });
});
