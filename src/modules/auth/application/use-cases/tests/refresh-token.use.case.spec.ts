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
    };
    tokenService = {
      verifyToken: jest.fn(),
      signToken: jest.fn(),
    };
    bcryptService = {
      compareHashedInput: jest.fn(),
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
    tokenService.signToken.mockResolvedValue('new-access-token');

    await expect(refreshTokenUseCase.execute(refreshToken)).resolves.toEqual({
      accessToken: 'new-access-token',
    });

    expect(authService.findSessionsByUserId).toHaveBeenCalledWith('userId');
    expect(bcryptService.compareHashedInput).toHaveBeenCalledWith(
      refreshToken,
      'hashed-refresh-token',
    );
    expect(tokenService.signToken).toHaveBeenCalledWith(
      {
        sub: 'userId',
        email: 'test@example.com',
        role: 'CUSTOMER',
        tokenType: 'access',
      },
      { expiresIn: '15m' },
    );
  });
});
