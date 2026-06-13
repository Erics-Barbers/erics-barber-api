import { Role } from 'src/generated/prisma/client';
import { AuthService } from './auth.prisma-repository';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';

describe('AuthService repository', () => {
  it('deletes only unverified customer users created before the cutoff', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 2 });
    const prismaService = {
      user: {
        deleteMany,
      },
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );
    const cutoff = new Date('2026-06-06T02:00:00.000Z');

    await expect(
      authService.deleteUnverifiedCustomersCreatedBefore(cutoff),
    ).resolves.toBe(2);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        isEmailVerified: false,
        role: Role.CUSTOMER,
        createdAt: { lt: cutoff },
      },
    });
  });

  it('deletes expired sessions before the reference date', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 5 });
    const prismaService = {
      session: {
        deleteMany,
      },
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );
    const referenceDate = new Date('2026-06-13T03:00:00.000Z');

    await expect(
      authService.deleteExpiredSessions(referenceDate),
    ).resolves.toBe(5);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: referenceDate },
      },
    });
  });

  it('deletes expired MFA challenges before the reference date', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 3 });
    const prismaService = {
      mfaChallenge: {
        deleteMany,
      },
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );
    const referenceDate = new Date('2026-06-13T03:00:00.000Z');

    await expect(
      authService.deleteExpiredMfaChallenges(referenceDate),
    ).resolves.toBe(3);

    expect(deleteMany).toHaveBeenCalledWith({
      where: {
        expiresAt: { lt: referenceDate },
      },
    });
  });

  it('rotates a refresh token session in a transaction', async () => {
    const deleteSession = jest.fn().mockResolvedValue(undefined);
    const createSession = jest.fn().mockResolvedValue(undefined);
    const transaction = jest.fn().mockImplementation(
      async (
        callback: (tx: {
          session: {
            delete: typeof deleteSession;
            create: typeof createSession;
          };
        }) => Promise<void>,
      ) =>
        callback({
          session: {
            delete: deleteSession,
            create: createSession,
          },
        }),
    );
    const prismaService = {
      $transaction: transaction,
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );
    const newSessionData: SessionCreateInput = {
      user: { connect: { id: 'user-id' } },
      refreshToken: 'hashed-new-refresh-token',
      expiresAt: new Date('2026-06-20T00:00:00.000Z'),
      userAgent: 'test-agent',
    };

    await expect(
      authService.rotateRefreshTokenSession('old-session-id', newSessionData),
    ).resolves.toBeUndefined();

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(deleteSession).toHaveBeenCalledWith({
      where: { id: 'old-session-id' },
    });
    expect(createSession).toHaveBeenCalledWith({ data: newSessionData });
    expect(deleteSession.mock.invocationCallOrder[0]).toBeLessThan(
      createSession.mock.invocationCallOrder[0],
    );
  });
});
