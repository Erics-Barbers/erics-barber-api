import { Test, TestingModule } from '@nestjs/testing';
import { EnableMfaService } from './enable-mfa.service';

describe('EnableMfaService', () => {
  let service: EnableMfaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnableMfaService],
    }).compile();

    service = module.get<EnableMfaService>(EnableMfaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
