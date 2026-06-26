import { VerifyEmailUseCase } from '../verify-email.use-case';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import {
  EmailVerificationTokenPayload,
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';
import { MfaMethod, Role, User } from 'src/generated/prisma/client';

describe('VerifyEmailUseCase', () => {
  let verifyEmailUseCase: VerifyEmailUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      'findUserByEmail' | 'markEmailAsVerified' | 'createSession'
    >
  >;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'verifyToken' | 'issueTokens' | 'decodeToken'>
  >;
  let bcryptService: jest.Mocked<Pick<BcryptService, 'hashInput'>>;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      markEmailAsVerified: jest.fn(),
      createSession: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
    };
    verifyEmailUseCase = new VerifyEmailUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
      bcryptService as unknown as BcryptService,
    );
  });

  it('should verify email successfully and return tokens', async () => {
    const mockPayload: EmailVerificationTokenPayload = {
      email: 'test@example.com',
      tokenType: 'emailVerification',
      iat: 0,
      exp: 1,
    };
    const mockUser = createUser({
      id: 'userId',
      email: 'test@example.com',
      isEmailVerified: false,
    });
    tokenService.verifyToken.mockResolvedValue(mockPayload);
    authService.findUserByEmail.mockResolvedValue(mockUser);
    authService.markEmailAsVerified.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });
    const refreshPayload: RefreshTokenPayload = {
      sub: 'userId',
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      iat: 0,
      tokenType: 'refresh',
    };
    tokenService.decodeToken.mockReturnValue(refreshPayload);
    bcryptService.hashInput.mockResolvedValue('hashed-refresh-token');
    const result = await verifyEmailUseCase.execute(
      'valid-token',
      'test-agent',
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshMaxAgeSeconds: 43_200,
    });
    expect(authService.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
      }),
    );
  });

  it('should reject invalid or wrong-purpose verification tokens', async () => {
    tokenService.verifyToken.mockResolvedValue({
      email: 'test@example.com',
      tokenType: 'access',
      iat: 0,
      exp: 1,
    });

    await expect(
      verifyEmailUseCase.execute('access-token', 'test-agent'),
    ).rejects.toThrow(UnauthorizedException);

    expect(authService.markEmailAsVerified).not.toHaveBeenCalled();
    expect(authService.createSession).not.toHaveBeenCalled();
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'userId',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-06-14T00:00:00.000Z'),
    updatedAt: new Date('2026-06-14T00:00:00.000Z'),
    isEmailVerified: false,
    mfaEnabled: false,
    mfaMethod: MfaMethod.EMAIL,
    ...overrides,
  };
}
