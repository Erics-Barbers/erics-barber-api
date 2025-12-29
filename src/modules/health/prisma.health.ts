import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'prisma'): Promise<HealthIndicatorResult> {
    try {
      // Perform a simple query to check DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return this.healthIndicatorService.check(key).up();
    } catch (err) {
      return this.healthIndicatorService
        .check(key)
        .down({ message: err.message });
    }
  }
}
