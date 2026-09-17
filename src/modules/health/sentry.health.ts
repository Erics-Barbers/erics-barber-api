import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key = 'sentry'): HealthIndicatorResult {
    const dsnConfigured = Boolean(process.env.SENTRY_DSN);
    const required = process.env.SENTRY_ENVIRONMENT === 'production';

    if (!dsnConfigured && !required) {
      return this.healthIndicatorService.check(key).up({ enabled: false });
    }

    if (!dsnConfigured) {
      return this.healthIndicatorService
        .check(key)
        .down({ message: 'SENTRY_DSN is not configured' });
    }

    if (!Sentry.getClient()) {
      return this.healthIndicatorService
        .check(key)
        .down({ message: 'Sentry SDK is not initialized' });
    }

    return this.healthIndicatorService.check(key).up({ enabled: true });
  }
}
