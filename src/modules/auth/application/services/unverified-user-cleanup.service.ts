import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

const DEFAULT_UNVERIFIED_USER_TTL_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class UnverifiedUserCleanupService {
  private readonly logger = new Logger(UnverifiedUserCleanupService.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup(): Promise<void> {
    const deletedCount = await this.deleteStaleUnverifiedUsers();

    if (deletedCount > 0) {
      this.logger.log(
        `Deleted ${deletedCount} stale unverified customer account(s)`,
      );
    }
  }

  async deleteStaleUnverifiedUsers(referenceDate = new Date()) {
    const cutoff = this.getCutoffDate(referenceDate);
    return await this.authService.deleteUnverifiedCustomersCreatedBefore(
      cutoff,
    );
  }

  getCutoffDate(referenceDate = new Date()): Date {
    return new Date(
      referenceDate.getTime() - this.getRetentionDays() * MS_PER_DAY,
    );
  }

  getRetentionDays(): number {
    const configuredValue = Number(process.env.UNVERIFIED_USER_TTL_DAYS);

    if (Number.isInteger(configuredValue) && configuredValue > 0) {
      return configuredValue;
    }

    return DEFAULT_UNVERIFIED_USER_TTL_DAYS;
  }
}
