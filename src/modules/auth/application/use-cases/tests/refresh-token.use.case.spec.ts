import { RefreshTokenUseCase } from '../refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

  beforeEach(() => {
    authService = {
      findSessionsByUserId: jest.fn(),
      findUserById: jest.fn(),
      invalidateRefreshToken: jest.fn(),
      createSession: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      compareHashedInput: jest.fn(),
      hashInput: jest.fn(),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(
      authService,
      tokenService,
      bcryptService,
    );
  });

  it('should return a new access token for a valid refresh token session', async () => {
    const refreshToken = 'refresh-token';
    tokenService.verifyToken.mockResolvedValue({
      sub: 'userId',
      tokenType: 'refresh',
    });
    authService.findSessionsByUserId.mockResolvedValue([
      { refreshToken: 'hashed-refresh-token' },
    ]);
    bcryptService.compareHashedInput.mockResolvedValue(true);
    authService.findUserById.mockResolvedValue({
      id: 'userId',
      email: 'test@example.com',
      role: 'CUSTOMER',
    });
    authService.invalidateRefreshToken.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    tokenService.decodeToken.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });
    bcryptService.hashInput.mockResolvedValue('hashed-new-refresh-token');

    await expect(
      refreshTokenUseCase.execute(refreshToken, 'test-agent'),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(authService.findSessionsByUserId).toHaveBeenCalledWith('userId');
    expect(bcryptService.compareHashedInput).toHaveBeenCalledWith(
      refreshToken,
      'hashed-refresh-token',
    );
    expect(authService.invalidateRefreshToken).toHaveBeenCalledWith(
      'userId',
      refreshToken,
    );
    expect(tokenService.issueTokens).toHaveBeenCalledWith({
      id: 'userId',
      email: 'test@example.com',
      role: 'CUSTOMER',
    });
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'hashed-new-refresh-token',
        userAgent: 'test-agent',
      }),
    );
  });
});
