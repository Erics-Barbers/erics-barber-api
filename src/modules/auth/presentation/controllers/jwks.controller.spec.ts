import { JwksController } from './jwks.controller';

describe('JwksController', () => {
  let controller: JwksController;

  beforeEach(() => {
    controller = new JwksController();
  });

  it('should return JWKS keys', () => {
    const result = controller.getJwks();
    expect(result).toHaveProperty('keys');
    expect(Array.isArray(result.keys)).toBe(true);
    expect(result.keys[0]).toMatchObject({
      kty: 'RSA',
      kid: 'exampleKeyId',
      use: 'sig',
      alg: 'RS256',
      n: 'yourBase64urlEncodedModulus',
      e: 'AQAB',
    });
  });
});
