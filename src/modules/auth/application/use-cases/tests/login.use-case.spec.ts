jest.mock('src/infrastructure/mail/resend.service');

import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../login.use-case';
import { LoginRequestDto } from '../../../presentation/dto/login.dto';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

  const mockUser = {
    id: 'userId',
    email: 'test@example.com',
    isEmailVerified: true,
    passwordHash: 'hashedPassword',
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  };

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
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue(mockTokens);
    tokenService.decodeToken.mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    authService.createSession.mockResolvedValue(undefined);

    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    const result = await loginUseCase.execute(dto, 'Mozilla/5.0');

    expect(authService.validateUserCredentials).toHaveBeenCalledWith(
      'test@example.com',
      'Password1',
    );
    expect(tokenService.issueTokens).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual(mockTokens);
  });

  it('should throw UnauthorizedException if credentials are invalid', async () => {
    authService.validateUserCredentials.mockResolvedValue(null);

    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'WrongPassword',
    };

    await expect(loginUseCase.execute(dto, 'Mozilla/5.0')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if email is not verified', async () => {
    authService.validateUserCredentials.mockResolvedValue({
      ...mockUser,
      isEmailVerified: false,
    });

    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
    };

    await expect(loginUseCase.execute(dto, 'Mozilla/5.0')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should create a session after successful login', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 604800;
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue(mockTokens);
    tokenService.decodeToken.mockReturnValue({ exp: expiresAt });
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    authService.createSession.mockResolvedValue(undefined);

    await loginUseCase.execute({ email: 'test@example.com', password: 'Password1' }, 'Mozilla/5.0');

    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { connect: { id: mockUser.id } },
        refreshToken: 'hashed-refresh-token',
        userAgent: 'Mozilla/5.0',
      }),
    );
  });
});
