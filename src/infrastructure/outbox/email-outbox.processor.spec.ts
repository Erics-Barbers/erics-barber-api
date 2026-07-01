import { EmailOutboxProcessor } from './email-outbox.processor';
import { OutboxEventStatus, OutboxEventType } from 'src/generated/prisma/enums';

describe('EmailOutboxProcessor', () => {
  const resendService = {
    sendEmail: jest.fn(),
  };

  const createPrismaService = () => ({
    outboxEvent: {
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends due booking email events and marks them processed', async () => {
    const prismaService = createPrismaService();
    const event = {
      id: 'event-id',
      attempts: 0,
      createdAt: new Date('2026-08-01T09:00:00.000Z'),
      payload: {
        appointmentDate: '2026-08-01T10:00:00.000Z',
        barberName: 'Eric',
        bookingReference: 'booking-id',
        pricePence: 2500,
        serviceName: 'Haircut',
        status: 'CONFIRMED',
        to: 'customer@example.com',
      },
      status: OutboxEventStatus.PENDING,
      type: OutboxEventType.BOOKING_CONFIRMATION_EMAIL,
      updatedAt: new Date('2026-08-01T09:00:00.000Z'),
    };
    prismaService.outboxEvent.findMany.mockResolvedValue([event]);
    prismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    prismaService.outboxEvent.update.mockResolvedValue({});
    resendService.sendEmail.mockResolvedValue(undefined);

    const processor = new EmailOutboxProcessor(
      prismaService as never,
      resendService as never,
    );

    const processedCount = await processor.processDueEvents(
      new Date('2026-08-01T09:30:00.000Z'),
    );

    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'Booking Confirmation',
      expect.stringContaining('Booking confirmed'),
    );
    expect(prismaService.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-id' },
      data: {
        lastError: null,
        processedAt: expect.any(Date) as Date,
        status: OutboxEventStatus.PROCESSED,
      },
    });
    expect(processedCount).toBe(1);
  });

  it.each([
    {
      title: 'updated',
      type: OutboxEventType.BOOKING_UPDATED_EMAIL,
      subject: 'Booking Updated',
      renderedTitle: 'Booking updated',
      status: 'CONFIRMED',
    },
    {
      title: 'cancelled',
      type: OutboxEventType.BOOKING_CANCELLED_EMAIL,
      subject: 'Booking Cancelled',
      renderedTitle: 'Booking cancelled',
      status: 'CANCELLED',
    },
  ])(
    'sends due booking $title email events with booking details',
    async ({ type, subject, renderedTitle, status }) => {
      const prismaService = createPrismaService();
      const event = {
        id: 'event-id',
        attempts: 0,
        createdAt: new Date('2026-08-01T09:00:00.000Z'),
        payload: {
          appointmentDate: '2026-08-01T10:00:00.000Z',
          barberName: 'Eric',
          bookingReference: 'booking-id',
          pricePence: 3500,
          serviceName: 'Haircut + Beard',
          status,
          to: 'customer@example.com',
        },
        status: OutboxEventStatus.PENDING,
        type,
        updatedAt: new Date('2026-08-01T09:00:00.000Z'),
      };
      prismaService.outboxEvent.findMany.mockResolvedValue([event]);
      prismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
      prismaService.outboxEvent.update.mockResolvedValue({});
      resendService.sendEmail.mockResolvedValue(undefined);

      const processor = new EmailOutboxProcessor(
        prismaService as never,
        resendService as never,
      );

      const processedCount = await processor.processDueEvents(
        new Date('2026-08-01T09:30:00.000Z'),
      );

      expect(resendService.sendEmail).toHaveBeenCalledWith(
        'customer@example.com',
        subject,
        expect.stringContaining(renderedTitle),
      );
      expect(resendService.sendEmail).toHaveBeenCalledWith(
        'customer@example.com',
        subject,
        expect.stringContaining('35.00'),
      );
      expect(resendService.sendEmail).toHaveBeenCalledWith(
        'customer@example.com',
        subject,
        expect.stringContaining('booking-id'),
      );
      expect(processedCount).toBe(1);
    },
  );

  it('sends due auth email events', async () => {
    const prismaService = createPrismaService();
    const event = {
      id: 'event-id',
      attempts: 0,
      createdAt: new Date('2026-08-01T09:00:00.000Z'),
      payload: {
        link: 'https://ui.example.test/email-verify?token=verification-token',
        to: 'customer@example.com',
      },
      status: OutboxEventStatus.PENDING,
      type: OutboxEventType.AUTH_VERIFICATION_EMAIL,
      updatedAt: new Date('2026-08-01T09:00:00.000Z'),
    };
    prismaService.outboxEvent.findMany.mockResolvedValue([event]);
    prismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    prismaService.outboxEvent.update.mockResolvedValue({});
    resendService.sendEmail.mockResolvedValue(undefined);

    const processor = new EmailOutboxProcessor(
      prismaService as never,
      resendService as never,
    );

    const processedCount = await processor.processDueEvents(
      new Date('2026-08-01T09:30:00.000Z'),
    );

    expect(resendService.sendEmail).toHaveBeenCalledWith(
      'customer@example.com',
      'Verify Your Email',
      expect.stringContaining(
        'https://ui.example.test/email-verify?token=verification-token',
      ),
    );
    expect(processedCount).toBe(1);
  });

  it('marks failed email events for retry', async () => {
    const prismaService = createPrismaService();
    const event = {
      id: 'event-id',
      attempts: 1,
      createdAt: new Date('2026-08-01T09:00:00.000Z'),
      payload: {
        appointmentDate: '2026-08-01T10:00:00.000Z',
        bookingReference: 'booking-id',
        to: 'customer@example.com',
      },
      status: OutboxEventStatus.PENDING,
      type: OutboxEventType.BOOKING_UPDATED_EMAIL,
      updatedAt: new Date('2026-08-01T09:00:00.000Z'),
    };
    prismaService.outboxEvent.findMany.mockResolvedValue([event]);
    prismaService.outboxEvent.updateMany.mockResolvedValue({ count: 1 });
    prismaService.outboxEvent.update.mockResolvedValue({});
    resendService.sendEmail.mockRejectedValue(new Error('Resend unavailable'));

    const processor = new EmailOutboxProcessor(
      prismaService as never,
      resendService as never,
    );

    const processedCount = await processor.processDueEvents(
      new Date('2026-08-01T09:30:00.000Z'),
    );

    expect(prismaService.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-id' },
      data: {
        attempts: { increment: 1 },
        availableAt: new Date('2026-08-01T09:34:00.000Z'),
        lastError: 'Resend unavailable',
        status: OutboxEventStatus.FAILED,
      },
    });
    expect(processedCount).toBe(0);
  });
});
