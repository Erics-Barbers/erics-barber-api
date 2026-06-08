import { LogoutUseCase } from '../logout.use-case';

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      invalidateRefreshToken: jest.fn(),
    };
    tokenService = {
      decodeToken: jest.fn(),
    };
    logoutUseCase = new LogoutUseCase(authService, tokenService);
  });

  it('should logout a user successfully', async () => {
    const refreshToken = 'refresh-token';
    tokenService.decodeToken.mockReturnValue({
      sub: 'userId',
      tokenType: 'refresh',
    });
    authService.invalidateRefreshToken.mockResolvedValue(undefined);
    await logoutUseCase.execute(refreshToken);
    expect(authService.invalidateRefreshToken).toHaveBeenCalledWith(
      'userId',
      'refresh-token',
    );
  });
});
