import { getAutomationResetConfig } from './automation.config';

const validEnvironment: NodeJS.ProcessEnv = {
  APP_ENV: 'test',
  AUTOMATION_RESET_ENABLED: 'true',
  AUTOMATION_RESET_EXPECTED_ENVIRONMENT_ID: 'test-environment-id',
  AUTOMATION_RESET_TOKEN: 'a'.repeat(32),
  DATABASE_URL: 'postgresql://example.test/automation',
  RAILWAY_ENVIRONMENT_ID: 'test-environment-id',
};

describe('automation reset configuration', () => {
  it('stays disabled without requiring reset credentials', () => {
    expect(getAutomationResetConfig({})).toEqual({
      enabled: false,
      environmentId: '',
      token: '',
    });
  });

  it('accepts an explicitly identified test environment', () => {
    expect(getAutomationResetConfig(validEnvironment)).toEqual({
      enabled: true,
      environmentId: 'test-environment-id',
      token: 'a'.repeat(32),
    });
  });

  it.each([
    [{ ...validEnvironment, APP_ENV: 'production' }, 'test environment'],
    [
      {
        ...validEnvironment,
        RAILWAY_ENVIRONMENT_ID: 'different-environment-id',
      },
      'environment identity',
    ],
    [{ ...validEnvironment, AUTOMATION_RESET_TOKEN: 'short' }, '32'],
    [{ ...validEnvironment, DATABASE_URL: '' }, 'database connection'],
  ])('rejects unsafe configuration', (env, expectedMessage) => {
    expect(() => getAutomationResetConfig(env)).toThrow(expectedMessage);
  });
});
