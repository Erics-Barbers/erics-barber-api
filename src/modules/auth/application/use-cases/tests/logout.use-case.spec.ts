import { LogOutDto } from 'src/modules/auth/presentation/dto/logout.dto';
import { LogoutUseCase } from '../logout.use-case';

describe('LogoutUseCase', () => {
  let logoutUseCase: LogoutUseCase;
  let authService: any;

  beforeEach(() => {
    authService = {
      invalidateRefreshToken: jest.fn(),
    };
    logoutUseCase = new LogoutUseCase(authService);
  });

  it('should logout a user successfully', async () => {
    const dto: LogOutDto = {
      refreshToken: 'refresh-token',
      userId: 'userId',
    };
    authService.invalidateRefreshToken.mockResolvedValue(undefined);
    await logoutUseCase.execute(dto);
    expect(authService.invalidateRefreshToken).toHaveBeenCalledWith(
      'userId',
      'refresh-token',
    );
  });
});
