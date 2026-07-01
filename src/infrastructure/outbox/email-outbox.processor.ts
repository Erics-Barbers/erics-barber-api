import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxEventStatus, OutboxEventType } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import {
  renderBookingCancelledEmail,
  renderBookingConfirmationEmail,
  renderBookingUpdatedEmail,
} from 'src/infrastructure/mail/templates/booking-email-templates';
import {
  renderMfaCodeEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
} from 'src/infrastructure/mail/templates/auth-email-templates';

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 20;
const STALE_PROCESSING_MINUTES = 10;

type BookingEmailPayload = {
  appointmentDate: string;
  barberName?: string | null;
  bookingReference: string;
  pricePence?: number | null;
  serviceName?: string | null;
  status?: string | null;
  to: string;
};

type AuthEmailPayload = {
  code?: string;
  link?: string;
  to: string;
};

@Injectable()
export class EmailOutboxProcessor {
  private readonly logger = new Logger(EmailOutboxProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly resendService: ResendService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleOutbox(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    try {
      await this.processDueEvents();
    } finally {
      this.isProcessing = false;
    }
  }

  async processDueEvents(referenceDate = new Date()): Promise<number> {
    const staleProcessingCutoff = new Date(
      referenceDate.getTime() - STALE_PROCESSING_MINUTES * 60 * 1000,
    );
    const events = await this.prismaService.outboxEvent.findMany({
      where: {
        attempts: { lt: MAX_ATTEMPTS },
        type: {
          in: [
            OutboxEventType.AUTH_VERIFICATION_EMAIL,
            OutboxEventType.AUTH_PASSWORD_RESET_EMAIL,
            OutboxEventType.AUTH_MFA_CODE_EMAIL,
            OutboxEventType.BOOKING_CONFIRMATION_EMAIL,
            OutboxEventType.BOOKING_UPDATED_EMAIL,
            OutboxEventType.BOOKING_CANCELLED_EMAIL,
          ],
        },
        OR: [
          {
            status: {
              in: [OutboxEventStatus.PENDING, OutboxEventStatus.FAILED],
            },
            availableAt: { lte: referenceDate },
          },
          {
            status: OutboxEventStatus.PROCESSING,
            updatedAt: { lt: staleProcessingCutoff },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    });

    let processedCount = 0;

    for (const event of events) {
      const claim = await this.prismaService.outboxEvent.updateMany({
        where: {
          id: event.id,
          status: event.status,
        },
        data: { status: OutboxEventStatus.PROCESSING },
      });

      if (claim.count === 0) continue;

      try {
        await this.sendEmail(event.type, event.payload);
        await this.prismaService.outboxEvent.update({
          where: { id: event.id },
          data: {
            lastError: null,
            processedAt: new Date(),
            status: OutboxEventStatus.PROCESSED,
          },
        });
        processedCount += 1;
      } catch (error) {
        const nextAttempts = event.attempts + 1;
        await this.prismaService.outboxEvent.update({
          where: { id: event.id },
          data: {
            attempts: { increment: 1 },
            availableAt: this.getNextAttemptAt(referenceDate, nextAttempts),
            lastError:
              error instanceof Error ? error.message : 'Unknown outbox error',
            status: OutboxEventStatus.FAILED,
          },
        });
        this.logger.warn(
          `Failed to process outbox event ${event.id}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }

    return processedCount;
  }

  private async sendBookingEmail(type: OutboxEventType, payload: unknown) {
    const emailPayload = this.parseBookingEmailPayload(payload);
    const templateInput = {
      appointmentDate: new Date(emailPayload.appointmentDate),
      barberName: emailPayload.barberName,
      bookingReference: emailPayload.bookingReference,
      pricePence: emailPayload.pricePence,
      serviceName: emailPayload.serviceName,
      status: emailPayload.status,
    };

    const subject = this.getSubject(type);
    const html =
      type === OutboxEventType.BOOKING_CONFIRMATION_EMAIL
        ? renderBookingConfirmationEmail(templateInput)
        : type === OutboxEventType.BOOKING_UPDATED_EMAIL
          ? renderBookingUpdatedEmail(templateInput)
          : renderBookingCancelledEmail(templateInput);

    await this.resendService.sendEmail(emailPayload.to, subject, html);
  }

  private async sendAuthEmail(type: OutboxEventType, payload: unknown) {
    const emailPayload = this.parseAuthEmailPayload(payload);
    const subject = this.getSubject(type);
    const html =
      type === OutboxEventType.AUTH_VERIFICATION_EMAIL
        ? renderVerificationEmail(emailPayload.link ?? '')
        : type === OutboxEventType.AUTH_PASSWORD_RESET_EMAIL
          ? renderPasswordResetEmail(emailPayload.link ?? '')
          : renderMfaCodeEmail(emailPayload.code ?? '');

    await this.resendService.sendEmail(emailPayload.to, subject, html);
  }

  private async sendEmail(type: OutboxEventType, payload: unknown) {
    if (
      type === OutboxEventType.AUTH_VERIFICATION_EMAIL ||
      type === OutboxEventType.AUTH_PASSWORD_RESET_EMAIL ||
      type === OutboxEventType.AUTH_MFA_CODE_EMAIL
    ) {
      await this.sendAuthEmail(type, payload);
      return;
    }

    await this.sendBookingEmail(type, payload);
  }

  private parseBookingEmailPayload(payload: unknown): BookingEmailPayload {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Outbox payload is invalid');
    }

    const candidate = payload as Partial<BookingEmailPayload>;
    if (
      !candidate.to ||
      !candidate.appointmentDate ||
      !candidate.bookingReference
    ) {
      throw new Error('Booking email payload is incomplete');
    }

    return {
      appointmentDate: candidate.appointmentDate,
      barberName: candidate.barberName,
      bookingReference: candidate.bookingReference,
      pricePence: candidate.pricePence,
      serviceName: candidate.serviceName,
      status: candidate.status,
      to: candidate.to,
    };
  }

  private parseAuthEmailPayload(payload: unknown): AuthEmailPayload {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Outbox payload is invalid');
    }

    const candidate = payload as Partial<AuthEmailPayload>;
    if (!candidate.to) {
      throw new Error('Auth email payload is incomplete');
    }

    return {
      code: candidate.code,
      link: candidate.link,
      to: candidate.to,
    };
  }

  private getSubject(type: OutboxEventType) {
    if (type === OutboxEventType.AUTH_VERIFICATION_EMAIL) {
      return 'Verify Your Email';
    }

    if (type === OutboxEventType.AUTH_PASSWORD_RESET_EMAIL) {
      return 'Reset Your Password';
    }

    if (type === OutboxEventType.AUTH_MFA_CODE_EMAIL) {
      return "Your Eric's Barbers login code";
    }

    if (type === OutboxEventType.BOOKING_CONFIRMATION_EMAIL) {
      return 'Booking Confirmation';
    }

    if (type === OutboxEventType.BOOKING_UPDATED_EMAIL) {
      return 'Booking Updated';
    }

    return 'Booking Cancelled';
  }

  private getNextAttemptAt(referenceDate: Date, attempts: number) {
    const delayMinutes = Math.min(60, 2 ** attempts);
    return new Date(referenceDate.getTime() + delayMinutes * 60 * 1000);
  }
}
