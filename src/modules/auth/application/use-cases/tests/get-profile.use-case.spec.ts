import { GetProfileUseCase } from '../get-profile.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { UserProfile } from 'src/common/types/profile';

describe('GetProfileUseCase', () => {
  let getProfileUseCase: GetProfileUseCase;
  let authService: jest.Mocked<Pick<AuthService, 'getProfile'>>;

  beforeEach(() => {
    authService = {
      getProfile: jest.fn(),
    };
    getProfileUseCase = new GetProfileUseCase(
      authService as unknown as AuthService,
    );
  });

  it('should retrieve user profile successfully', async () => {
    const mockProfile: UserProfile = {
      id: 'userId',
      email: 'test@example.com',
      name: 'Test User',
      isEmailVerified: true,
    };
    authService.getProfile.mockResolvedValue(mockProfile);
    const result = await getProfileUseCase.execute('userId');
    expect(result).toEqual(mockProfile);
    expect(authService.getProfile).toHaveBeenCalledWith('userId');
  });
});
