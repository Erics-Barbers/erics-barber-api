import { ExpiredAuthStateCleanupService } from './expired-auth-state-cleanup.service';

describe('ExpiredAuthStateCleanupService', () => {
  const originalCleanupEnabled = process.env.AUTH_CLEANUP_JOBS_ENABLED;

  let authService: {
    deleteExpiredSessions: jest.Mock;
    deleteExpiredMfaChallenges: jest.Mock;
  };
  let service: ExpiredAuthStateCleanupService;

  beforeEach(() => {
    authService = {
      deleteExpiredSessions: jest.fn(),
      deleteExpiredMfaChallenges: jest.fn(),
    };
    service = new ExpiredAuthStateCleanupService(authService as never);
    delete process.env.AUTH_CLEANUP_JOBS_ENABLED;
  });

  afterAll(() => {
    if (originalCleanupEnabled === undefined) {
      delete process.env.AUTH_CLEANUP_JOBS_ENABLED;
    } else {
      process.env.AUTH_CLEANUP_JOBS_ENABLED = originalCleanupEnabled;
    }
  });

  it('skips the scheduled cleanup when disabled by environment', async () => {
    process.env.AUTH_CLEANUP_JOBS_ENABLED = 'false';

    await service.handleDailyCleanup();

    expect(authService.deleteExpiredSessions).not.toHaveBeenCalled();
    expect(authService.deleteExpiredMfaChallenges).not.toHaveBeenCalled();
  });

  it('deletes expired sessions and MFA challenges before the reference date', async () => {
    const referenceDate = new Date('2026-06-13T03:00:00.000Z');
    authService.deleteExpiredSessions.mockResolvedValue(4);
    authService.deleteExpiredMfaChallenges.mockResolvedValue(2);

    await expect(
      service.deleteExpiredAuthState(referenceDate),
    ).resolves.toEqual({
      sessionsDeleted: 4,
      mfaChallengesDeleted: 2,
    });
    expect(authService.deleteExpiredSessions).toHaveBeenCalledWith(
      referenceDate,
    );
    expect(authService.deleteExpiredMfaChallenges).toHaveBeenCalledWith(
      referenceDate,
    );
  });
});
