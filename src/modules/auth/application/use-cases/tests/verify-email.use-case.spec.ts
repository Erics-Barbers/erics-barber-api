import { VerifyEmailUseCase } from '../verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let verifyEmailUseCase: VerifyEmailUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      markEmailAsVerified: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
      issueTokens: jest.fn(),
    };
    verifyEmailUseCase = new VerifyEmailUseCase(authService, tokenService);
  });

  it('should verify email successfully and return tokens', async () => {
    const mockPayload = { email: 'test@example.com' };
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      isEmailVerified: false,
    };
    tokenService.verifyToken.mockResolvedValue(mockPayload);
    authService.findUserByEmail.mockResolvedValue(mockUser);
    authService.markEmailAsVerified.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const result = await verifyEmailUseCase.execute('valid-token');
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
