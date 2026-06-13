import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { Role } from 'src/generated/prisma/client';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      'findSessionsByUserId' | 'findUserById' | 'rotateRefreshTokenSession'
    >
  >;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'verifyToken' | 'issueTokens' | 'decodeToken'>
  >;
  let bcryptService: jest.Mocked<
    Pick<BcryptService, 'compareHashedInput' | 'hashInput'>
  >;

  beforeEach(() => {
    authService = {
      findSessionsByUserId: jest.fn(),
      findUserById: jest.fn(),
      rotateRefreshTokenSession: jest.fn(),
    };
    tokenService = {
      verifyToken: jest.fn(),
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      compareHashedInput: jest.fn(),
      hashInput: jest.fn(),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
      bcryptService as unknown as BcryptService,
    );
  });

  it('should return a new access token for a valid refresh token session', async () => {
    const refreshToken = 'refresh-token';
    tokenService.verifyToken.mockResolvedValue({
      sub: 'userId',
      tokenType: 'refresh',
      iat: 1,
      exp: 2,
    } satisfies RefreshTokenPayload);
    authService.findSessionsByUserId.mockResolvedValue([
      {
        id: 'old-session-id',
        userId: 'userId',
        refreshToken: 'hashed-refresh-token',
        userAgent: 'test-agent',
        ipAddress: null,
        expiresAt: new Date('2026-06-20T00:00:00.000Z'),
        createdAt: new Date('2026-06-13T00:00:00.000Z'),
        barberId: null,
      },
    ]);
    bcryptService.compareHashedInput.mockResolvedValue(true);
    authService.findUserById.mockResolvedValue({
      id: 'userId',
      name: 'Test Customer',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: Role.CUSTOMER,
      createdAt: new Date('2026-06-13T00:00:00.000Z'),
      updatedAt: new Date('2026-06-13T00:00:00.000Z'),
      isEmailVerified: true,
    });
    authService.rotateRefreshTokenSession.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    tokenService.decodeToken.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      sub: 'userId',
      tokenType: 'refresh',
      iat: 1,
    } satisfies RefreshTokenPayload);
    bcryptService.hashInput.mockResolvedValue('hashed-new-refresh-token');

    await expect(
      refreshTokenUseCase.execute(refreshToken, 'test-agent'),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(authService.findSessionsByUserId).toHaveBeenCalledWith('userId');
    expect(bcryptService.compareHashedInput).toHaveBeenCalledWith(
      refreshToken,
      'hashed-refresh-token',
    );
    expect(tokenService.issueTokens).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'userId',
        email: 'test@example.com',
        role: Role.CUSTOMER,
      }),
    );
    expect(authService.rotateRefreshTokenSession).toHaveBeenCalledWith(
      'old-session-id',
      expect.objectContaining({
        refreshToken: 'hashed-new-refresh-token',
        userAgent: 'test-agent',
      }),
    );
  });
});
