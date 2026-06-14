import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import {
  RefreshTokenPayload,
  TokenService,
} from '../../../infrastructure/services/jwt.service';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { Role } from 'src/generated/prisma/client';
import { SessionRevocationReason } from 'src/generated/prisma/enums';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      | 'findRefreshTokenSessionCandidatesByUserId'
      | 'findUserById'
      | 'rotateRefreshTokenSession'
      | 'revokeRefreshTokenSessionFamily'
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
      findRefreshTokenSessionCandidatesByUserId: jest.fn(),
      findUserById: jest.fn(),
      rotateRefreshTokenSession: jest.fn(),
      revokeRefreshTokenSessionFamily: jest.fn(),
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
    authService.findRefreshTokenSessionCandidatesByUserId.mockResolvedValue([
      {
        id: 'old-session-id',
        userId: 'userId',
        refreshToken: 'hashed-refresh-token',
        familyId: 'session-family-id',
        replacedBySessionId: null,
        revokedAt: null,
        revokedReason: null,
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
      mfaEnabled: false,
      mfaMethod: 'EMAIL',
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

    expect(
      authService.findRefreshTokenSessionCandidatesByUserId,
    ).toHaveBeenCalledWith('userId');
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
        familyId: 'session-family-id',
        userAgent: 'test-agent',
      }),
    );
  });

  it('should revoke the session family when a rotated refresh token is replayed', async () => {
    const refreshToken = 'rotated-refresh-token';
    tokenService.verifyToken.mockResolvedValue({
      sub: 'userId',
      tokenType: 'refresh',
      iat: 1,
      exp: 2,
    } satisfies RefreshTokenPayload);
    authService.findRefreshTokenSessionCandidatesByUserId.mockResolvedValue([
      {
        id: 'old-session-id',
        userId: 'userId',
        refreshToken: 'hashed-rotated-refresh-token',
        familyId: 'session-family-id',
        replacedBySessionId: 'current-session-id',
        revokedAt: new Date('2026-06-13T00:05:00.000Z'),
        revokedReason: SessionRevocationReason.ROTATED,
        userAgent: 'test-agent',
        ipAddress: null,
        expiresAt: new Date('2026-06-20T00:00:00.000Z'),
        createdAt: new Date('2026-06-13T00:00:00.000Z'),
        barberId: null,
      },
      {
        id: 'current-session-id',
        userId: 'userId',
        refreshToken: 'hashed-current-refresh-token',
        familyId: 'session-family-id',
        replacedBySessionId: null,
        revokedAt: null,
        revokedReason: null,
        userAgent: 'test-agent',
        ipAddress: null,
        expiresAt: new Date('2026-06-20T00:05:00.000Z'),
        createdAt: new Date('2026-06-13T00:05:00.000Z'),
        barberId: null,
      },
    ]);
    bcryptService.compareHashedInput.mockImplementation((_input, hash) =>
      Promise.resolve(hash === 'hashed-rotated-refresh-token'),
    );
    authService.revokeRefreshTokenSessionFamily.mockResolvedValue(1);

    await expect(
      refreshTokenUseCase.execute(refreshToken, 'test-agent'),
    ).rejects.toThrow('Refresh token replay detected');

    expect(authService.revokeRefreshTokenSessionFamily).toHaveBeenCalledWith(
      'session-family-id',
      SessionRevocationReason.REPLAY_DETECTED,
    );
    expect(authService.findUserById).not.toHaveBeenCalled();
    expect(tokenService.issueTokens).not.toHaveBeenCalled();
    expect(authService.rotateRefreshTokenSession).not.toHaveBeenCalled();
  });
});
