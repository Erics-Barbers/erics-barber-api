import { GetProfileUseCase } from '../get-profile.use-case';

describe('GetProfileUseCase', () => {
  let getProfileUseCase: GetProfileUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      getProfile: jest.fn(),
    };
    getProfileUseCase = new GetProfileUseCase(authService);
  });

  it('should retrieve user profile successfully', async () => {
    const mockProfile = {
      id: 'userId',
      email: 'test@example.com',
      name: 'Test User',
    };
    authService.getProfile.mockResolvedValue(mockProfile);
    const result = await getProfileUseCase.execute('userId');
    expect(result).toEqual(mockProfile);
    expect(authService.getProfile).toHaveBeenCalledWith('userId');
  });
});
