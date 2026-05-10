jest.mock('src/infrastructure/mail/resend.service');

import { UnauthorizedException } from '@nestjs/common';
import { RefreshTokenUseCase } from '../refresh-token.use-case';
import { RefreshTokenRequestDto } from '../../../presentation/dto/refresh-token.dto';

describe('RefreshTokenUseCase', () => {
  let refreshTokenUseCase: RefreshTokenUseCase;
  let authService: any;
  let tokenService: any;
  let bcryptService: any;

  const mockTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };
  const mockSession = { id: 'session-id', refreshToken: 'hashed-old-refresh-token', userId: 'userId' };
  const mockDto: RefreshTokenRequestDto = { userId: 'userId', email: 'test@example.com' };
  const oldRefreshToken = 'old-refresh-token';

  beforeEach(() => {
    authService = {
      findSession: jest.fn(),
      invalidateRefreshToken: jest.fn(),
      createSession: jest.fn(),
    };
    tokenService = {
      issueTokens: jest.fn(),
      decodeToken: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
      compareHashedInput: jest.fn(),
    };

    refreshTokenUseCase = new RefreshTokenUseCase(authService, tokenService, bcryptService);
  });

  it('should rotate refresh token and return new tokens', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 604800;
    bcryptService.hashInput.mockResolvedValue('hashed-old-refresh-token');
    authService.findSession.mockResolvedValue(mockSession);
    bcryptService.compareHashedInput.mockResolvedValue(true);
    authService.invalidateRefreshToken.mockResolvedValue(undefined);
    tokenService.issueTokens.mockResolvedValue(mockTokens);
    tokenService.decodeToken.mockReturnValue({ exp: expiresAt });
    authService.createSession.mockResolvedValue(undefined);

    const result = await refreshTokenUseCase.execute(mockDto, oldRefreshToken);

    expect(result).toEqual(mockTokens);
    expect(authService.invalidateRefreshToken).toHaveBeenCalled();
    expect(tokenService.issueTokens).toHaveBeenCalledWith({ id: mockDto.userId, email: mockDto.email });
    expect(authService.createSession).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if session is not found', async () => {
    bcryptService.hashInput.mockResolvedValue('hashed-token');
    authService.findSession.mockResolvedValue(null);

    await expect(
      refreshTokenUseCase.execute(mockDto, oldRefreshToken),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if refresh token is invalid', async () => {
    bcryptService.hashInput.mockResolvedValue('hashed-token');
    authService.findSession.mockResolvedValue(mockSession);
    bcryptService.compareHashedInput.mockResolvedValue(false);
    authService.invalidateRefreshToken.mockResolvedValue(undefined);

    await expect(
      refreshTokenUseCase.execute(mockDto, oldRefreshToken),
    ).rejects.toThrow(UnauthorizedException);

    expect(authService.invalidateRefreshToken).toHaveBeenCalled();
  });
});
