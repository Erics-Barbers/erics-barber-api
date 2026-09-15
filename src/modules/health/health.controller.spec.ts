import { HealthController } from './health.controller';

describe('HealthController', () => {
  const health = {
    check: jest.fn(),
  };
  const prisma = {
    isHealthy: jest.fn(),
  };
  const resend = {
    isHealthy: jest.fn(),
  };

  let controller: HealthController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new HealthController(
      health as never,
      prisma as never,
      resend as never,
    );
  });

  it('returns a side-effect-free liveness response', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
    expect(health.check).not.toHaveBeenCalled();
  });

  it('keeps the default health endpoint side-effect free', async () => {
    health.check.mockResolvedValue({ status: 'ok' });
    prisma.isHealthy.mockResolvedValue({ database: { status: 'up' } });

    await controller.check();
    const checks = health.check.mock.calls[0][0] as Array<() => unknown>;
    await checks[0]();

    expect(prisma.isHealthy).toHaveBeenCalledWith('database');
    expect(resend.isHealthy).not.toHaveBeenCalled();
  });

  it('checks email delivery only on the explicit email endpoint', async () => {
    health.check.mockResolvedValue({ status: 'ok' });
    resend.isHealthy.mockResolvedValue({ resend: { status: 'up' } });

    await controller.email();
    const checks = health.check.mock.calls[0][0] as Array<() => unknown>;
    await checks[0]();

    expect(resend.isHealthy).toHaveBeenCalledWith('resend');
  });
});
