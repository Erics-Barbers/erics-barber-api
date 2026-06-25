import { VerifyMfaUseCase } from '../verify-mfa.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import {
  MfaChallenge,
  MfaMethod,
  Role,
  User,
} from 'src/generated/prisma/client';

describe('VerifyMfaUseCase', () => {
  let verifyMfaUseCase: VerifyMfaUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      'findMfaChallengeById' | 'findUserById' | 'completeMfaChallenge'
    >
  >;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'issueTokens' | 'decodeToken'>
  >;
  let bcryptService: jest.Mocked<
    Pick<BcryptService, 'compareHashedInput' | 'hashInput'>
  >;

  beforeEach(() => {
    authService = {
      findMfaChallengeById: jest.fn(),
      findUserById: jest.fn(),
      completeMfaChallenge: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      compareHashedInput: jest.fn(),
      hashInput: jest.fn(),
    };

    verifyMfaUseCase = new VerifyMfaUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
      bcryptService as unknown as BcryptService,
    );
  });

  it('should verify an MFA challenge and issue auth tokens', async () => {
    authService.findMfaChallengeById.mockResolvedValue(createChallenge());
    bcryptService.compareHashedInput.mockResolvedValue(true);
    authService.findUserById.mockResolvedValue(createUser());
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
    });
    tokenService.decodeToken.mockReturnValue({
      sub: 'user-id',
      tokenType: 'refresh',
      iat: 1,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    } satisfies RefreshTokenPayload);
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    authService.completeMfaChallenge.mockResolvedValue(undefined);

    await expect(
      verifyMfaUseCase.execute(
        { challengeId: 'challenge-id', code: '123456' },
        'test-agent',
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 604_800,
    });

    expect(tokenService.issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-id' }),
      { rememberMe: true },
    );

    expect(bcryptService.compareHashedInput).toHaveBeenCalledWith(
      '123456',
      'hashed-code',
    );
    expect(authService.completeMfaChallenge).toHaveBeenCalledWith(
      'challenge-id',
      expect.objectContaining({
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
        rememberMe: true,
      }),
    );
  });

  it('should reject expired MFA challenges', async () => {
    authService.findMfaChallengeById.mockResolvedValue({
      ...createChallenge(),
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(
      verifyMfaUseCase.execute(
        { challengeId: 'challenge-id', code: '123456' },
        'test-agent',
      ),
    ).rejects.toThrow('Invalid or expired MFA challenge');
    expect(tokenService.issueTokens).not.toHaveBeenCalled();
  });
});

function createChallenge(overrides: Partial<MfaChallenge> = {}): MfaChallenge {
  return {
    id: 'challenge-id',
    userId: 'user-id',
    codeHash: 'hashed-code',
    method: MfaMethod.EMAIL,
    rememberMe: true,
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    createdAt: new Date('2026-06-13T00:00:00.000Z'),
    ...overrides,
  };
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-06-13T00:00:00.000Z'),
    updatedAt: new Date('2026-06-13T00:00:00.000Z'),
    isEmailVerified: true,
    mfaEnabled: true,
    mfaMethod: MfaMethod.EMAIL,
    ...overrides,
  };
}
