import { Module } from '@nestjs/common';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EmailOutboxProcessor } from './email-outbox.processor';

@Module({
  imports: [PrismaModule],
  providers: [EmailOutboxProcessor, ResendService],
})
export class OutboxModule {}
