import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { timingSafeEqual } from 'node:crypto';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { getAutomationResetConfig } from './automation.config';
import {
  AUTOMATION_CUSTOMER_PASSWORD,
  AUTOMATION_FIXTURE_VERSION,
  resetAndSeedAutomationData,
} from './automation-fixtures';

const AUTOMATION_RESET_LOCK_ID = 1_743_291_007;

@Injectable()
export class AutomationService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    getAutomationResetConfig();
  }

  async reset(authorizationHeader: string | undefined) {
    const config = getAutomationResetConfig();

    if (!config.enabled) {
      throw new NotFoundException();
    }

    const suppliedToken = authorizationHeader?.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length)
      : '';

    if (!this.tokensMatch(config.token, suppliedToken)) {
      throw new UnauthorizedException();
    }

    const passwordHash = await hash(AUTOMATION_CUSTOMER_PASSWORD, 10);
    const fixtures = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${AUTOMATION_RESET_LOCK_ID})`;
        return resetAndSeedAutomationData(tx, passwordHash);
      },
      { timeout: 30_000 },
    );

    return {
      fixtureVersion: AUTOMATION_FIXTURE_VERSION,
      environmentId: config.environmentId,
      fixtures,
    };
  }

  private tokensMatch(expected: string, supplied: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(supplied);

    return (
      expectedBuffer.length === suppliedBuffer.length &&
      timingSafeEqual(expectedBuffer, suppliedBuffer)
    );
  }
}
