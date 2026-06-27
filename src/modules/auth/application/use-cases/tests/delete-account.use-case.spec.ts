import { DeleteAccountUseCase } from '../delete-account.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';

describe('DeleteAccountUseCase', () => {
  it('should soft-delete the current user account', async () => {
    const authService = {
      softDeleteAccount: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new DeleteAccountUseCase(
      authService as unknown as AuthService,
    );

    await expect(useCase.execute('user-id')).resolves.toBeUndefined();

    expect(authService.softDeleteAccount).toHaveBeenCalledWith('user-id');
  });
});
