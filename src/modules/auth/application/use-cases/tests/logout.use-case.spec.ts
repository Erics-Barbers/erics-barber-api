import { LogoutUseCase } from '../logout.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;
  let authService: jest.Mocked<Pick<AuthService, 'invalidateRefreshToken'>>;
  let tokenService: jest.Mocked<Pick<TokenService, 'decodeToken'>>;

  beforeEach(() => {
    authService = {
      invalidateRefreshToken: jest.fn(),
    };
    tokenService = {
      decodeToken: jest.fn(),
    };
    logoutUseCase = new LogoutUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
    );
  });

  it('should logout a user successfully', async () => {
    const refreshToken = 'refresh-token';
    tokenService.decodeToken.mockReturnValue({
      sub: 'userId',
      tokenType: 'refresh',
    } as RefreshTokenPayload);
    authService.invalidateRefreshToken.mockResolvedValue(undefined);
    await logoutUseCase.execute(refreshToken);
    expect(authService.invalidateRefreshToken).toHaveBeenCalledWith(
      'userId',
      'refresh-token',
    );
  });

  it('should succeed when there is no refresh token', async () => {
    await expect(logoutUseCase.execute()).resolves.toBeUndefined();

    expect(tokenService.decodeToken).not.toHaveBeenCalled();
    expect(authService.invalidateRefreshToken).not.toHaveBeenCalled();
  });

  it('should succeed when the refresh token cannot be decoded', async () => {
    tokenService.decodeToken.mockReturnValue(null);

    await expect(
      logoutUseCase.execute('invalid-token'),
    ).resolves.toBeUndefined();

    expect(authService.invalidateRefreshToken).not.toHaveBeenCalled();
  });

  it('should succeed when the token is not a refresh token', async () => {
    tokenService.decodeToken.mockReturnValue({
      sub: 'userId',
      tokenType: 'access',
    } as unknown as RefreshTokenPayload);

    await expect(
      logoutUseCase.execute('access-token'),
    ).resolves.toBeUndefined();

    expect(authService.invalidateRefreshToken).not.toHaveBeenCalled();
  });
});
