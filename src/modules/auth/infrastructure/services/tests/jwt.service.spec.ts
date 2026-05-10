import { TokenService } from '../jwt.service';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-unit-tests';
    tokenService = new TokenService();
  });

  describe('generateTokens', () => {
    it('should generate an access token and a refresh token', async () => {
      const { accessToken, refreshToken } = await tokenService.generateTokens('test@example.com');

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });

    it('should generate different tokens for different emails', async () => {
      const tokens1 = await tokenService.generateTokens('user1@example.com');
      const tokens2 = await tokenService.generateTokens('user2@example.com');

      expect(tokens1.accessToken).not.toBe(tokens2.accessToken);
      expect(tokens1.refreshToken).not.toBe(tokens2.refreshToken);
    });
  });

  describe('issueTokens', () => {
    it('should issue tokens for a user with id and email', async () => {
      const user = { id: 'user-id', email: 'test@example.com' };
      const { accessToken, refreshToken } = await tokenService.issueTokens(user);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    it('should include the user id (sub) in the access token payload', async () => {
      const user = { id: 'user-id-123', email: 'test@example.com' };
      const { accessToken } = await tokenService.issueTokens(user);

      const decoded = tokenService.decodeToken(accessToken) as any;
      expect(decoded.sub).toBe('user-id-123');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should not include email in the refresh token', async () => {
      const user = { id: 'user-id-123', email: 'test@example.com' };
      const { refreshToken } = await tokenService.issueTokens(user);

      const decoded = tokenService.decodeToken(refreshToken) as any;
      expect(decoded.sub).toBe('user-id-123');
      expect(decoded.email).toBeUndefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return its payload', async () => {
      const { accessToken } = await tokenService.generateTokens('test@example.com');

      const payload = await tokenService.verifyToken(accessToken);

      expect(payload).toBeDefined();
      expect((payload as any).email).toBe('test@example.com');
    });

    it('should return null for an invalid token', async () => {
      const result = await tokenService.verifyToken('invalid.token.string');

      expect(result).toBeNull();
    });

    it('should return null for an expired token', async () => {
      // Sign a token that expires immediately using the internal signToken
      const expiredToken = await tokenService.signToken({ email: 'test@example.com' }, { expiresIn: '0s' });

      // Small delay to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await tokenService.verifyToken(expiredToken);
      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', async () => {
      const { accessToken } = await tokenService.generateTokens('test@example.com');

      const decoded = tokenService.decodeToken(accessToken) as any;

      expect(decoded).toBeDefined();
      expect(decoded.email).toBe('test@example.com');
    });

    it('should return null for a malformed token', () => {
      const result = tokenService.decodeToken('not-a-jwt');

      expect(result).toBeNull();
    });
  });
});
