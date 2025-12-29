import { MfaDto } from '../../../presentation/dto/mfa.dto';
import { EnableMfaUseCase } from '../enable-mfa.use-case';

describe('EnableMfaUseCase', () => {
  let enableMfaUseCase: EnableMfaUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      enableMfa: jest.fn(),
    };
    enableMfaUseCase = new EnableMfaUseCase(authService);
  });

  it('should enable MFA for a user', async () => {
    const dto: MfaDto = {
      userId: 'userId',
      mfaCode: '123456',
    };
    authService.enableMfa.mockResolvedValue(undefined);
    await enableMfaUseCase.execute(dto);
    expect(authService.enableMfa).toHaveBeenCalledWith('userId', '123456');
  });
});
