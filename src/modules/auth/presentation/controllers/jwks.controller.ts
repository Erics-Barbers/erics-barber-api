import { Controller, Get } from '@nestjs/common';

@Controller('jwks')
export class JwksController {
  @Get()
  getJwks() {
    return {
      keys: [
        {
          kty: 'RSA',
          kid: 'exampleKeyId',
          use: 'sig',
          alg: 'RS256',
          n: 'yourBase64urlEncodedModulus',
          e: 'AQAB',
        },
      ],
    };
  }
}