import * as Sentry from '@sentry/nestjs';
import { SentryHealthIndicator } from './sentry.health';

describe('SentryHealthIndicator', () => {
  const check = jest.fn();
  const up = jest.fn();
  const down = jest.fn();
  const originalDsn = process.env.SENTRY_DSN;
  const originalEnvironment = process.env.SENTRY_ENVIRONMENT;

  let indicator: SentryHealthIndicator;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    check.mockReturnValue({ up, down });
    indicator = new SentryHealthIndicator({ check } as never);
    delete process.env.SENTRY_DSN;
    delete process.env.SENTRY_ENVIRONMENT;
  });

  afterAll(() => {
    if (originalDsn === undefined) {
      delete process.env.SENTRY_DSN;
    } else {
      process.env.SENTRY_DSN = originalDsn;
    }

    if (originalEnvironment === undefined) {
      delete process.env.SENTRY_ENVIRONMENT;
    } else {
      process.env.SENTRY_ENVIRONMENT = originalEnvironment;
    }
  });

  it('stays healthy when Sentry is intentionally disabled', () => {
    indicator.isHealthy();

    expect(up).toHaveBeenCalledWith({ enabled: false });
  });

  it('fails production readiness when the DSN is missing', () => {
    process.env.SENTRY_ENVIRONMENT = 'production';

    indicator.isHealthy();

    expect(down).toHaveBeenCalledWith({
      message: 'SENTRY_DSN is not configured',
    });
  });

  it('fails readiness when the SDK is not initialized', () => {
    process.env.SENTRY_DSN = 'https://example.invalid/1';
    jest.spyOn(Sentry, 'getClient').mockReturnValue(undefined);

    indicator.isHealthy();

    expect(down).toHaveBeenCalledWith({
      message: 'Sentry SDK is not initialized',
    });
  });

  it('passes readiness when the SDK is initialized', () => {
    process.env.SENTRY_DSN = 'https://example.invalid/1';
    jest.spyOn(Sentry, 'getClient').mockReturnValue({} as never);

    indicator.isHealthy();

    expect(up).toHaveBeenCalledWith({ enabled: true });
  });
});
