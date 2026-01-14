import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';
import { ResendHealthIndicator } from './resend.health';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ResendService } from 'src/infrastructure/mail/resend.service';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, ResendHealthIndicator, ResendService],
})
export class HealthModule {}
