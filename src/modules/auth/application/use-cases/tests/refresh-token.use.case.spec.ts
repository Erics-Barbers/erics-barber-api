import { RefreshTokenUseCase } from '../refresh-token.use-case';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      invalidateRefreshToken: jest.fn(),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(authService);
  });

  it('should invalidate the refresh token', async () => {
    const userId = 'userId';
    const refreshToken = 'refresh-token';

    await refreshTokenUseCase.execute(userId, refreshToken);
    expect(authService.invalidateRefreshToken).toHaveBeenCalledWith(
      userId,
      refreshToken,
    );
  });
});
