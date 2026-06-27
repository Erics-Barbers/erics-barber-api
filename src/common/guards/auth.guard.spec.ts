import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  it('should reject access tokens for deleted users', async () => {
    const tokenService = {
      verifyToken: jest.fn().mockResolvedValue({
        sub: 'user-id',
        tokenType: 'access',
      }),
    };
    const prismaService = {
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const guard = new AuthGuard(
      tokenService as unknown as TokenService,
      prismaService as unknown as PrismaService,
    );

    await expect(
      guard.canActivate(
        createContext({
          headers: { authorization: 'Bearer access-token' },
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(prismaService.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'user-id', deletedAt: null },
      select: { id: true },
    });
  });
});
