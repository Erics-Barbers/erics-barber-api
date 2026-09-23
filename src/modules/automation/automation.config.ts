import { ServiceUnavailableException } from '@nestjs/common';

export type AutomationResetConfig = {
  enabled: boolean;
  environmentId: string;
  token: string;
};

export function getAutomationResetConfig(
  env: NodeJS.ProcessEnv = process.env,
): AutomationResetConfig {
  const enabled = env.AUTOMATION_RESET_ENABLED === 'true';

  if (!enabled) {
    return { enabled: false, environmentId: '', token: '' };
  }

  const environmentName = env.RAILWAY_ENVIRONMENT_NAME ?? env.APP_ENV;
  const environmentId = env.RAILWAY_ENVIRONMENT_ID ?? '';
  const expectedEnvironmentId =
    env.AUTOMATION_RESET_EXPECTED_ENVIRONMENT_ID ?? '';
  const token = env.AUTOMATION_RESET_TOKEN ?? '';

  if (environmentName !== 'test') {
    throw new ServiceUnavailableException(
      'Automation reset is restricted to the test environment',
    );
  }

  if (
    !environmentId ||
    !expectedEnvironmentId ||
    environmentId !== expectedEnvironmentId
  ) {
    throw new ServiceUnavailableException(
      'Automation reset environment identity is invalid',
    );
  }

  if (token.length < 32) {
    throw new ServiceUnavailableException(
      'Automation reset token must contain at least 32 characters',
    );
  }

  if (!env.DATABASE_URL) {
    throw new ServiceUnavailableException(
      'Automation reset requires a database connection',
    );
  }

  return { enabled, environmentId, token };
}
