import { LoginUseCase } from '../login.use-case';
import { LoginRequestDto } from '../../../presentation/dto/login.dto';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

  beforeEach(() => {
    authService = {
      validateUserCredentials: jest.fn(),
      createSession: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
    };
    loginUseCase = new LoginUseCase(authService, tokenService, bcryptService);
  });

  it('should login a user successfully and return tokens', async () => {
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      role: 'CUSTOMER',
      isEmailVerified: true,
    };
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    tokenService.decodeToken.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    const result = await loginUseCase.execute(dto, 'test-agent');
    expect(authService.validateUserCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password1',
    );
    expect(tokenService.issueTokens).toHaveBeenCalledWith(mockUser);
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
      }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should throw UnauthorizedException if email is not verified', async () => {
    const mockUser = {
      id: 'userId',
      email: 'test@example.com',
      role: 'CUSTOMER',
      isEmailVerified: false,
    };
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(loginUseCase.execute(dto, 'test-agent')).rejects.toThrow(
      'Email not verified',
    );
  });
});
