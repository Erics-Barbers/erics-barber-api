import {
  AUTOMATION_FIXTURE_VERSION,
  automationFixtureAccounts,
  resetAndSeedAutomationData,
} from './automation-fixtures';

function delegate() {
  return {
    createMany: jest.fn().mockResolvedValue({ count: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  };
}

describe('automation fixtures', () => {
  it('clears mutable data and installs the versioned customer baseline', async () => {
    const tx = {
      barber: delegate(),
      barberAvailabilityException: delegate(),
      barberAvailabilityRule: delegate(),
      booking: delegate(),
      bookingCreationIdempotency: delegate(),
      externalAccount: delegate(),
      mfa: delegate(),
      mfaChallenge: delegate(),
      outboxEvent: delegate(),
      service: delegate(),
      session: delegate(),
      user: delegate(),
    };

    const fixtures = await resetAndSeedAutomationData(
      tx as never,
      'password-hash',
      new Date('2026-09-22T12:00:00.000Z'),
    );

    for (const model of Object.values(tx)) {
      expect(model.deleteMany).toHaveBeenCalledTimes(1);
    }
    expect(tx.service.createMany).toHaveBeenCalledTimes(1);
    expect(tx.user.createMany).toHaveBeenCalledTimes(1);
    expect(tx.barber.createMany).toHaveBeenCalledTimes(1);
    expect(tx.barberAvailabilityRule.createMany).toHaveBeenCalledTimes(1);
    expect(tx.booking.createMany).toHaveBeenCalledTimes(1);
    expect(fixtures.accounts).toEqual(automationFixtureAccounts);
    expect(fixtures.bookingReferences).toEqual(
      expect.objectContaining({
        guest: '10000000-0000-4000-8000-000000000005',
        upcoming: '10000000-0000-4000-8000-000000000001',
      }),
    );
    expect(AUTOMATION_FIXTURE_VERSION).toBe('customer-e2e-v1');
  });
});
