import { UpdateProfileUseCase } from '../update-profile.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { UserProfile } from 'src/common/types/profile';
import { UpdateProfileDto } from '../../../presentation/dto/update-profile.dto';

describe('UpdateProfileUseCase', () => {
  let updateProfileUseCase: UpdateProfileUseCase;
  let authService: jest.Mocked<Pick<AuthService, 'updateProfile'>>;

  beforeEach(() => {
    authService = {
      updateProfile: jest.fn(),
    };
    updateProfileUseCase = new UpdateProfileUseCase(
      authService as unknown as AuthService,
    );
  });

  it('should update user profile successfully', async () => {
    const userId = 'userId';
    const profileData: UpdateProfileDto = {
      name: ' New Name ',
    };
    const updatedProfile: UserProfile = {
      id: userId,
      name: 'New Name',
      email: 'test@example.com',
      isEmailVerified: true,
    };
    authService.updateProfile.mockResolvedValue(updatedProfile);
    await updateProfileUseCase.execute(userId, profileData);
    expect(authService.updateProfile).toHaveBeenCalledWith(userId, {
      name: 'New Name',
    });
  });
});
