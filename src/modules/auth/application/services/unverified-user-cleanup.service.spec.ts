import { UnverifiedUserCleanupService } from './unverified-user-cleanup.service';

describe('UnverifiedUserCleanupService', () => {
  let authService: { deleteUnverifiedCustomersCreatedBefore: jest.Mock };
  let service: UnverifiedUserCleanupService;
  const originalTtl = process.env.UNVERIFIED_USER_TTL_DAYS;

  beforeEach(() => {
    authService = {
      deleteUnverifiedCustomersCreatedBefore: jest.fn(),
    };
    service = new UnverifiedUserCleanupService(authService as never);
    delete process.env.UNVERIFIED_USER_TTL_DAYS;
  });

  afterAll(() => {
    if (originalTtl === undefined) {
      delete process.env.UNVERIFIED_USER_TTL_DAYS;
    } else {
      process.env.UNVERIFIED_USER_TTL_DAYS = originalTtl;
    }
  });

  it('defaults to a seven day retention window', () => {
    expect(service.getRetentionDays()).toBe(7);
  });

  it('uses the configured positive integer retention window', () => {
    process.env.UNVERIFIED_USER_TTL_DAYS = '14';

    expect(service.getRetentionDays()).toBe(14);
  });

  it('ignores invalid retention values', () => {
    process.env.UNVERIFIED_USER_TTL_DAYS = '0';

    expect(service.getRetentionDays()).toBe(7);
  });

  it('deletes stale unverified users before the cutoff date', async () => {
    const referenceDate = new Date('2026-06-13T02:00:00.000Z');
    authService.deleteUnverifiedCustomersCreatedBefore.mockResolvedValue(3);

    await expect(
      service.deleteStaleUnverifiedUsers(referenceDate),
    ).resolves.toBe(3);
    expect(
      authService.deleteUnverifiedCustomersCreatedBefore,
    ).toHaveBeenCalledWith(new Date('2026-06-06T02:00:00.000Z'));
  });
});
