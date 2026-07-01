-- Add auth email event types to the transactional outbox.
ALTER TYPE "OutboxEventType" ADD VALUE 'AUTH_VERIFICATION_EMAIL';
ALTER TYPE "OutboxEventType" ADD VALUE 'AUTH_PASSWORD_RESET_EMAIL';
ALTER TYPE "OutboxEventType" ADD VALUE 'AUTH_MFA_CODE_EMAIL';
