import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { CreateEmailResponse } from 'resend';
import { ResendService } from 'src/infrastructure/mail/resend.service';

@Injectable()
export class ResendHealthIndicator {
  constructor(
    private readonly resendService: ResendService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'resend'): Promise<HealthIndicatorResult> {
    try {
      const testEmail = 'fahmidulhaque97@pm.me';
      // Perform a simple operation to check Resend service connectivity
      const response: CreateEmailResponse = await this.resendService.sendEmail(
        testEmail,
        'Health Check',
        '<p>This is a health check email.</p>',
      );
      if (!response) {
        throw new Error('Failed to send test email via Resend service');
      }
      return this.healthIndicatorService.check(key).up();
    } catch (err) {
      return this.healthIndicatorService
        .check(key)
        .down({ message: err.message });
    }
  }
}
