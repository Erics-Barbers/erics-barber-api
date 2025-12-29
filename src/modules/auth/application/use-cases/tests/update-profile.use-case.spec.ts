import { UpdateProfileUseCase } from '../update-profile.use-case';

describe('UpdateProfileUseCase', () => {
  let updateProfileUseCase: UpdateProfileUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      updateProfile: jest.fn(),
    };
    updateProfileUseCase = new UpdateProfileUseCase(authService);
  });

  it('should update user profile successfully', async () => {
    const userId = 'userId';
    const profileData = {
      name: 'New Name',
      email: 'test@example.com',
    };
    authService.updateProfile.mockResolvedValue(undefined);
    await updateProfileUseCase.execute(userId, profileData);
    expect(authService.updateProfile).toHaveBeenCalledWith(
      userId,
      profileData,
    );
  });
});
