import { ResetPasswordEmailUseCase } from '../reset-password-email.use-case';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { TokenService } from '../../../infrastructure/services/jwt.service';
import { MfaMethod, Role, User } from 'src/generated/prisma/client';
import { PasswordResetSurface } from '../../../presentation/dto/reset-password-email.dto';

describe('ResetPasswordEmailUseCase', () => {
  let resetPasswordEmailUseCase: ResetPasswordEmailUseCase;
  let authService: jest.Mocked<
    Pick<AuthService, 'findUserByEmail' | 'sendResetPasswordEmail'>
  >;
  let tokenService: jest.Mocked<Pick<TokenService, 'issuePasswordResetToken'>>;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
    };
    tokenService = {
      issuePasswordResetToken: jest.fn(),
    };
    resetPasswordEmailUseCase = new ResetPasswordEmailUseCase(
      authService as unknown as AuthService,
      tokenService as unknown as TokenService,
    );
  });

  it('should send reset password email if user exists', async () => {
    const mockUser = createUser({
      email: 'test@example.com',
    });
    authService.findUserByEmail.mockResolvedValue(mockUser);
    tokenService.issuePasswordResetToken.mockResolvedValue(
      'password-reset-token',
    );
    await resetPasswordEmailUseCase.execute(mockUser.email);
    expect(authService.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    expect(tokenService.issuePasswordResetToken).toHaveBeenCalledWith(
      mockUser.email,
    );
    expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
      mockUser.email,
      'password-reset-token',
      PasswordResetSurface.CUSTOMER,
    );
  });

  it('should send staff reset links when requested from the staff surface', async () => {
    const mockUser = createUser({
      email: 'barber@example.com',
      role: Role.BARBER,
    });
    authService.findUserByEmail.mockResolvedValue(mockUser);
    tokenService.issuePasswordResetToken.mockResolvedValue(
      'password-reset-token',
    );

    await resetPasswordEmailUseCase.execute(
      mockUser.email,
      PasswordResetSurface.STAFF,
    );

    expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(
      mockUser.email,
      'password-reset-token',
      PasswordResetSurface.STAFF,
    );
  });

  it('should not send email if user does not exist', async () => {
    authService.findUserByEmail.mockResolvedValue(null);
    await resetPasswordEmailUseCase.execute('test@example.com');
    expect(authService.findUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(tokenService.issuePasswordResetToken).not.toHaveBeenCalled();
    expect(authService.sendResetPasswordEmail).not.toHaveBeenCalled();
  });
});

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'userId',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-06-14T00:00:00.000Z'),
    updatedAt: new Date('2026-06-14T00:00:00.000Z'),
    deletedAt: null,
    anonymizedAt: null,
    isEmailVerified: true,
    mfaEnabled: false,
    mfaMethod: MfaMethod.EMAIL,
    ...overrides,
  };
}
