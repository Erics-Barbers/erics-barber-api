import { Role } from 'src/generated/prisma/client';
import { AuthService } from './auth.prisma-repository';
import { SessionCreateInput } from 'src/generated/prisma/models/Session';
import { SessionRevocationReason } from 'src/generated/prisma/enums';

describe('AuthService repository', () => {
  const originalClientBaseUrl = process.env.CLIENT_BASE_URL;
  const originalStaffClientBaseUrl = process.env.STAFF_CLIENT_BASE_URL;

  afterEach(() => {
    restoreEnv('CLIENT_BASE_URL', originalClientBaseUrl);
    restoreEnv('STAFF_CLIENT_BASE_URL', originalStaffClientBaseUrl);
  });

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
    const updateSession = jest.fn().mockResolvedValue({ id: 'old-session-id' });
    const createSession = jest.fn().mockResolvedValue({ id: 'new-session-id' });
    const transaction = jest.fn().mockImplementation(
      async (
        callback: (tx: {
          session: {
            update: typeof updateSession;
            create: typeof createSession;
          };
        }) => Promise<void>,
      ) =>
        callback({
          session: {
            update: updateSession,
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
      familyId: 'session-family-id',
      expiresAt: new Date('2026-06-20T00:00:00.000Z'),
      userAgent: 'test-agent',
    };

    await expect(
      authService.rotateRefreshTokenSession('old-session-id', newSessionData),
    ).resolves.toBeUndefined();

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenNthCalledWith(1, {
      where: { id: 'old-session-id' },
      data: {
        revokedAt: expect.any(Date) as Date,
        revokedReason: SessionRevocationReason.ROTATED,
      },
    });
    expect(createSession).toHaveBeenCalledWith({ data: newSessionData });
    expect(updateSession).toHaveBeenNthCalledWith(2, {
      where: { id: 'old-session-id' },
      data: { replacedBySessionId: 'new-session-id' },
    });
    expect(updateSession.mock.invocationCallOrder[0]).toBeLessThan(
      createSession.mock.invocationCallOrder[0],
    );
    expect(createSession.mock.invocationCallOrder[0]).toBeLessThan(
      updateSession.mock.invocationCallOrder[1],
    );
  });

  it('revokes active sessions in a refresh token session family', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prismaService = {
      session: {
        updateMany,
      },
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );

    await expect(
      authService.revokeRefreshTokenSessionFamily(
        'session-family-id',
        SessionRevocationReason.REPLAY_DETECTED,
      ),
    ).resolves.toBe(1);

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        familyId: 'session-family-id',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date) as Date,
        revokedReason: SessionRevocationReason.REPLAY_DETECTED,
      },
    });
  });

  it('soft-deletes and anonymizes customer accounts while preserving rows', async () => {
    const deletedAt = new Date('2026-06-26T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(deletedAt);
    const updateManySessions = jest.fn().mockResolvedValue({ count: 2 });
    const deleteManyMfaChallenges = jest.fn().mockResolvedValue({ count: 1 });
    const deleteManyMfa = jest.fn().mockResolvedValue({ count: 1 });
    const deleteManyExternalAccounts = jest
      .fn()
      .mockResolvedValue({ count: 1 });
    const updateUser = jest.fn().mockResolvedValue({});
    const transaction = jest
      .fn()
      .mockImplementation(
        async (
          callback: (tx: {
            session: { updateMany: typeof updateManySessions };
            mfaChallenge: { deleteMany: typeof deleteManyMfaChallenges };
            mfa: { deleteMany: typeof deleteManyMfa };
            externalAccount: { deleteMany: typeof deleteManyExternalAccounts };
            barber: { update: jest.Mock };
            user: { update: typeof updateUser };
          }) => Promise<void>,
        ) =>
          callback({
            session: { updateMany: updateManySessions },
            mfaChallenge: { deleteMany: deleteManyMfaChallenges },
            mfa: { deleteMany: deleteManyMfa },
            externalAccount: { deleteMany: deleteManyExternalAccounts },
            barber: { update: jest.fn() },
            user: { update: updateUser },
          }),
      );
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          role: Role.CUSTOMER,
          deletedAt: null,
          barber: null,
        }),
      },
      $transaction: transaction,
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );

    await expect(
      authService.softDeleteAccount('user-id'),
    ).resolves.toBeUndefined();

    expect(updateManySessions).toHaveBeenCalledWith({
      where: { userId: 'user-id', revokedAt: null },
      data: {
        revokedAt: deletedAt,
        revokedReason: SessionRevocationReason.ACCOUNT_DELETED,
      },
    });
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: {
        name: 'Deleted customer',
        email: 'deleted-user-user-id@deleted.erics-barbers.local',
        passwordHash: null,
        isEmailVerified: false,
        mfaEnabled: false,
        deletedAt,
        anonymizedAt: deletedAt,
      },
    });
    jest.useRealTimers();
  });

  it('deactivates barber profiles when soft-deleting barber accounts', async () => {
    const deactivatedAt = new Date('2026-06-26T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(deactivatedAt);
    const updateBarber = jest.fn().mockResolvedValue({});
    const transaction = jest
      .fn()
      .mockImplementation(
        async (
          callback: (tx: {
            session: { updateMany: jest.Mock };
            mfaChallenge: { deleteMany: jest.Mock };
            mfa: { deleteMany: jest.Mock };
            externalAccount: { deleteMany: jest.Mock };
            barber: { update: typeof updateBarber };
            user: { update: jest.Mock };
          }) => Promise<void>,
        ) =>
          callback({
            session: { updateMany: jest.fn() },
            mfaChallenge: { deleteMany: jest.fn() },
            mfa: { deleteMany: jest.fn() },
            externalAccount: { deleteMany: jest.fn() },
            barber: { update: updateBarber },
            user: { update: jest.fn() },
          }),
      );
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-id',
          role: Role.BARBER,
          deletedAt: null,
          barber: { id: 'barber-id' },
        }),
      },
      $transaction: transaction,
    };
    const authService = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
    );

    await authService.softDeleteAccount('user-id');

    expect(updateBarber).toHaveBeenCalledWith({
      where: { id: 'barber-id' },
      data: {
        displayName: 'Deleted barber barber-id',
        phone: 'deleted-barber-id',
        isActive: false,
        deactivatedAt,
      },
    });
    jest.useRealTimers();
  });

  it('uses the configured staff base URL for staff password reset emails', async () => {
    process.env.CLIENT_BASE_URL = 'https://ui.example.test';
    process.env.STAFF_CLIENT_BASE_URL = 'https://staff.example.test';
    const sendEmail = jest.fn().mockResolvedValue(undefined);
    const authService = new AuthService(
      {} as never,
      {} as never,
      { sendEmail } as never,
    );

    await authService.sendResetPasswordEmail(
      'barber@example.com',
      'password-reset-token',
      'STAFF',
    );

    expect(sendEmail).toHaveBeenCalledWith(
      'barber@example.com',
      'Reset Your Password',
      expect.stringContaining(
        'https://staff.example.test/reset-password?token=password-reset-token',
      ),
    );
  });
});

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
