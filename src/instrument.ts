import * as Sentry from '@sentry/nestjs';

const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: Boolean(process.env.SENTRY_DSN),
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE,
  tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
  sendDefaultPii: false,
});
