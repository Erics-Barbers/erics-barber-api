import { LoginUseCase } from '../login.use-case';
import { LoginRequestDto } from '../../../presentation/dto/login.dto';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { MfaMethod, Role, User } from 'src/generated/prisma/client';

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      | 'validateUserCredentials'
      | 'createSession'
      | 'createMfaChallenge'
      | 'sendMfaCodeEmail'
    >
  >;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'issueTokens' | 'decodeToken'>
  >;
  let bcryptService: jest.Mocked<Pick<BcryptService, 'hashInput'>>;

  beforeEach(() => {
    authService = {
      validateUserCredentials: jest.fn(),
      createSession: jest.fn(),
      createMfaChallenge: jest.fn(),
      sendMfaCodeEmail: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
    };
    loginUseCase = new LoginUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
      bcryptService as unknown as BcryptService,
    );
  });

  it('should login a user successfully and return tokens', async () => {
    const mockUser = createUser({ mfaEnabled: false });
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });
    tokenService.decodeToken.mockReturnValue({
      sub: 'userId',
      tokenType: 'refresh',
      iat: 1,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    } satisfies RefreshTokenPayload);
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
    expect(tokenService.issueTokens).toHaveBeenCalledWith(mockUser, {
      rememberMe: false,
    });
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
        rememberMe: false,
      }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });
  });

  it('should create a persistent session when rememberMe is true', async () => {
    const mockUser = createUser({ mfaEnabled: false });
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
    });
    tokenService.decodeToken.mockReturnValue({
      sub: 'userId',
      tokenType: 'refresh',
      iat: 1,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    } satisfies RefreshTokenPayload);
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');

    await loginUseCase.execute(
      {
        email: 'test@example.com',
        password: 'Password1',
        rememberMe: true,
      },
      'test-agent',
    );

    expect(tokenService.issueTokens).toHaveBeenCalledWith(mockUser, {
      rememberMe: true,
    });
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        rememberMe: true,
      }),
    );
  });

  it('should throw UnauthorizedException if email is not verified', async () => {
    const mockUser = createUser({
      isEmailVerified: false,
      mfaEnabled: false,
    });
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(loginUseCase.execute(dto, 'test-agent')).rejects.toThrow(
      'Email not verified',
    );
  });

  it('should return MFA_REQUIRED and not issue tokens when MFA is enabled', async () => {
    const mockUser = createUser({
      mfaEnabled: true,
      mfaMethod: MfaMethod.EMAIL,
    });
    authService.validateUserCredentials.mockResolvedValue(mockUser);
    bcryptService.hashInput.mockResolvedValue('hashed-mfa-code');
    authService.createMfaChallenge.mockResolvedValue({
      id: 'challenge-id',
      userId: 'userId',
      codeHash: 'hashed-mfa-code',
      method: MfaMethod.EMAIL,
      rememberMe: true,
      expiresAt: new Date(Date.now() + 60_000),
      consumedAt: null,
      createdAt: new Date('2026-06-13T00:00:00.000Z'),
    });
    authService.sendMfaCodeEmail.mockResolvedValue(undefined);
    const dto: LoginRequestDto = {
      email: 'test@example.com',
      password: 'Password1',
      rememberMe: true,
    };

    const result = await loginUseCase.execute(dto, 'test-agent');

    expect(tokenService.issueTokens).not.toHaveBeenCalled();
    expect(authService.createSession).not.toHaveBeenCalled();
    expect(authService.createMfaChallenge).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'userId',
        codeHash: 'hashed-mfa-code',
        method: MfaMethod.EMAIL,
        rememberMe: true,
      }),
    );
    expect(authService.sendMfaCodeEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringMatching(/^\d{6}$/),
    );
    expect(result).toEqual({
      message: 'MFA required',
      code: 'MFA_REQUIRED',
      mfaRequired: true,
      challengeId: 'challenge-id',
      mfaMethod: MfaMethod.EMAIL,
    });
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'userId',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-06-13T00:00:00.000Z'),
    updatedAt: new Date('2026-06-13T00:00:00.000Z'),
    isEmailVerified: true,
    mfaEnabled: false,
    mfaMethod: MfaMethod.EMAIL,
    ...overrides,
  };
}
