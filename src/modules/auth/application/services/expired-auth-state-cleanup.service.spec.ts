import { ExpiredAuthStateCleanupService } from './expired-auth-state-cleanup.service';

describe('ExpiredAuthStateCleanupService', () => {
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
