import { BcryptService } from '../bcrypt.service';

describe('BcryptService', () => {
  let bcryptService: BcryptService;

  beforeEach(() => {
    bcryptService = new BcryptService();
  });

  it('should hash a password', async () => {
    const password = 'MySecretPassword123!';
    const hash = await bcryptService.hashInput(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('should produce different hashes for the same input (salted)', async () => {
    const password = 'MySecretPassword123!';
    const hash1 = await bcryptService.hashInput(password);
    const hash2 = await bcryptService.hashInput(password);

    expect(hash1).not.toBe(hash2);
  });

  it('should return true when comparing a correct password against its hash', async () => {
    const password = 'MySecretPassword123!';
    const hash = await bcryptService.hashInput(password);

    const result = await bcryptService.compareHashedInput(password, hash);

    expect(result).toBe(true);
  });

  it('should return false when comparing an incorrect password against a hash', async () => {
    const password = 'MySecretPassword123!';
    const wrongPassword = 'WrongPassword456!';
    const hash = await bcryptService.hashInput(password);

    const result = await bcryptService.compareHashedInput(wrongPassword, hash);

    expect(result).toBe(false);
  });
});
