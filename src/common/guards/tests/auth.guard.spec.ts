import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth.guard';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let tokenService: any;

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    const mockRequest = { headers, user: undefined as any };
    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    tokenService = {
      verifyToken: jest.fn(),
    };
    authGuard = new AuthGuard(tokenService);
  });

  it('should allow access when a valid Bearer token is provided', async () => {
    const mockPayload = { sub: 'user-id', email: 'test@example.com', iat: 0, exp: 9999999999 };
    tokenService.verifyToken.mockResolvedValue(mockPayload);

    const context = createMockContext({ authorization: 'Bearer valid-token' });

    const result = await authGuard.canActivate(context);

    expect(result).toBe(true);
    expect(tokenService.verifyToken).toHaveBeenCalledWith('valid-token');
  });

  it('should attach the user payload to the request', async () => {
    const mockPayload = { sub: 'user-id', email: 'test@example.com', iat: 0, exp: 9999999999 };
    tokenService.verifyToken.mockResolvedValue(mockPayload);

    const mockRequest = { headers: { authorization: 'Bearer valid-token' }, user: undefined as any };
    const context = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
    } as unknown as ExecutionContext;

    await authGuard.canActivate(context);

    expect(mockRequest.user).toEqual(expect.objectContaining({ sub: 'user-id' }));
  });

  it('should throw UnauthorizedException when authorization header is missing', async () => {
    const context = createMockContext({});

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when authorization header does not start with Bearer', async () => {
    const context = createMockContext({ authorization: 'Basic some-token' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is invalid or expired', async () => {
    tokenService.verifyToken.mockResolvedValue(null);

    const context = createMockContext({ authorization: 'Bearer invalid-token' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token payload has no sub', async () => {
    tokenService.verifyToken.mockResolvedValue({ email: 'test@example.com' });

    const context = createMockContext({ authorization: 'Bearer some-token' });

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
