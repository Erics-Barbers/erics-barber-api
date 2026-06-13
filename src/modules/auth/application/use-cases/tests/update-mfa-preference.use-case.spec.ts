import { MfaMethod } from 'src/generated/prisma/client';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { UpdateMfaPreferenceUseCase } from '../update-mfa-preference.use-case';

describe('UpdateMfaPreferenceUseCase', () => {
  let authService: jest.Mocked<Pick<AuthService, 'setMfaPreference'>>;
  let useCase: UpdateMfaPreferenceUseCase;

  beforeEach(() => {
    authService = {
      setMfaPreference: jest.fn(),
    };
    useCase = new UpdateMfaPreferenceUseCase(
      authService as unknown as AuthService,
    );
  });

  it('should update MFA preference using EMAIL by default', async () => {
    authService.setMfaPreference.mockResolvedValue(undefined);

    await useCase.execute('user-id', { enabled: true });

    expect(authService.setMfaPreference).toHaveBeenCalledWith(
      'user-id',
      true,
      MfaMethod.EMAIL,
    );
  });
});
