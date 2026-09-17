import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { ResendHealthIndicator } from './resend.health';
import { SentryHealthIndicator } from './sentry.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaHealthIndicator,
    private resend: ResendHealthIndicator,
    private sentry: SentryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.ready();
  }

  @Get('live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.isHealthy('database'),
      () => this.sentry.isHealthy('sentry'),
    ]);
  }

  @Get('email')
  @HealthCheck()
  email(): Promise<HealthCheckResult> {
    return this.health.check([() => this.resend.isHealthy('resend')]);
  }
}
