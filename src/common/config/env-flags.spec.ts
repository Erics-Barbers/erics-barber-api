import { isEnvFlagEnabled } from './env-flags';

describe('isEnvFlagEnabled', () => {
  const originalEnv = process.env.FEATURE_FLAG_TEST;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.FEATURE_FLAG_TEST;
    } else {
      process.env.FEATURE_FLAG_TEST = originalEnv;
    }
  });

  it('uses the default when the flag is unset', () => {
    delete process.env.FEATURE_FLAG_TEST;

    expect(isEnvFlagEnabled('FEATURE_FLAG_TEST')).toBe(true);
    expect(isEnvFlagEnabled('FEATURE_FLAG_TEST', false)).toBe(false);
  });

  it('recognizes enabled values', () => {
    process.env.FEATURE_FLAG_TEST = 'yes';

    expect(isEnvFlagEnabled('FEATURE_FLAG_TEST', false)).toBe(true);
  });

  it('recognizes disabled values', () => {
    process.env.FEATURE_FLAG_TEST = 'off';

    expect(isEnvFlagEnabled('FEATURE_FLAG_TEST')).toBe(false);
  });
});
