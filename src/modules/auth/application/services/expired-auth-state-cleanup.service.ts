import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class ExpiredAuthStateCleanupService {
  private readonly logger = new Logger(ExpiredAuthStateCleanupService.name);

  constructor(private readonly authService: AuthService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailyCleanup(): Promise<void> {
    const result = await this.deleteExpiredAuthState();

    if (result.sessionsDeleted > 0 || result.mfaChallengesDeleted > 0) {
      this.logger.log(
        `Deleted ${result.sessionsDeleted} expired session(s) and ${result.mfaChallengesDeleted} expired MFA challenge(s)`,
      );
    }
  }

  async deleteExpiredAuthState(referenceDate = new Date()): Promise<{
    sessionsDeleted: number;
    mfaChallengesDeleted: number;
  }> {
    const [sessionsDeleted, mfaChallengesDeleted] = await Promise.all([
      this.authService.deleteExpiredSessions(referenceDate),
      this.authService.deleteExpiredMfaChallenges(referenceDate),
    ]);

    return { sessionsDeleted, mfaChallengesDeleted };
  }
}
