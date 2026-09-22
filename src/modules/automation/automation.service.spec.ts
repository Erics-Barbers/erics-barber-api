import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AutomationService } from './automation.service';

function restoreEnvironment(
  originalValues: Record<string, string | undefined>,
) {
  for (const [name, value] of Object.entries(originalValues)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

describe('AutomationService', () => {
  const variableNames = [
    'APP_ENV',
    'AUTOMATION_RESET_ENABLED',
    'AUTOMATION_RESET_EXPECTED_ENVIRONMENT_ID',
    'AUTOMATION_RESET_TOKEN',
    'DATABASE_URL',
    'RAILWAY_ENVIRONMENT_ID',
  ];
  const originalValues = Object.fromEntries(
    variableNames.map((name) => [name, process.env[name]]),
  );
  const prisma = { $transaction: jest.fn() };
  const service = new AutomationService(prisma as never);

  afterEach(() => {
    restoreEnvironment(originalValues);
    prisma.$transaction.mockReset();
  });

  it('is indistinguishable from a missing route when disabled', async () => {
    delete process.env.AUTOMATION_RESET_ENABLED;

    await expect(service.reset(undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a request without the configured bearer token', async () => {
    process.env.APP_ENV = 'test';
    process.env.AUTOMATION_RESET_ENABLED = 'true';
    process.env.AUTOMATION_RESET_EXPECTED_ENVIRONMENT_ID = 'test-id';
    process.env.AUTOMATION_RESET_TOKEN = 'a'.repeat(32);
    process.env.DATABASE_URL = 'postgresql://example.test/automation';
    process.env.RAILWAY_ENVIRONMENT_ID = 'test-id';

    await expect(service.reset('Bearer wrong-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
