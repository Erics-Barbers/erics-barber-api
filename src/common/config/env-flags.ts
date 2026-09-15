const ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on', 'enabled']);
const DISABLED_VALUES = new Set(['0', 'false', 'no', 'off', 'disabled']);

export function isEnvFlagEnabled(
  name: string,
  defaultValue = true,
): boolean {
  const value = process.env[name];

  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (ENABLED_VALUES.has(normalizedValue)) {
    return true;
  }

  if (DISABLED_VALUES.has(normalizedValue)) {
    return false;
  }

  return defaultValue;
}
