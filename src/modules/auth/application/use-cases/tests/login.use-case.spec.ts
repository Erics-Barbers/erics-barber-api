import { LoginUseCase } from '../login.use-case';
import { LoginDto } from '../../../presentation/dto/login.dto';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let authService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      validateUserCredentials: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
    };
    loginUseCase = new LoginUseCase(authService, tokenService);
  });

  it('should login a user successfully and return tokens', async () => {
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      isEmailVerified: true,
    };
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    const result = await loginUseCase.execute(dto);
    expect(authService.validateUserCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password1',
    );
    expect(tokenService.issueTokens).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should throw UnauthorizedException if email is not verified', async () => {
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      isEmailVerified: false,
    };
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    const dto: LoginDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(loginUseCase.execute(dto)).rejects.toThrow(
      'Email not verified',
    );
  });
});
