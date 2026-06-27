import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from '../register.use-case';
import { RegisterDto } from '../../../presentation/dto/register.dto';
import { AuthService } from '../../../infrastructure/prisma/auth.prisma-repository';
import { BcryptService } from '../../../infrastructure/services/bcrypt.service';
import { TokenService } from '../../../infrastructure/services/jwt.service';
import { MfaMethod, Role, User } from 'src/generated/prisma/client';

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase;
  let authService: jest.Mocked<
    Pick<
      AuthService,
      'findUserByEmail' | 'createUser' | 'sendVerificationEmail'
    >
  >;
  let bcryptService: jest.Mocked<Pick<BcryptService, 'hashInput'>>;
  let tokenService: jest.Mocked<
    Pick<TokenService, 'issueEmailVerificationToken'>
  >;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };
    bcryptService = {
      hashInput: jest.fn(),
    };
    tokenService = {
      issueEmailVerificationToken: jest.fn(),
    };
    registerUseCase = new RegisterUseCase(
      authService as unknown as AuthService,
      bcryptService as unknown as BcryptService,
      tokenService as unknown as TokenService,
    );
  });

  it('should register a user successfully and call all related services', async () => {
    authService.findUserByEmail.mockResolvedValue(null);
    bcryptService.hashInput.mockResolvedValue('hashedPassword');
    tokenService.issueEmailVerificationToken.mockResolvedValue('token');
    authService.createUser.mockResolvedValue(createUser());
    authService.sendVerificationEmail.mockResolvedValue(undefined);

    const dto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(registerUseCase.execute(dto)).resolves.toBeUndefined();
    expect(authService.findUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(bcryptService.hashInput).toHaveBeenCalledWith('Password1');
    expect(authService.createUser).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
    });
    expect(tokenService.issueEmailVerificationToken).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'token',
    );
  });

  it('should throw ConflictException if email is already in use', async () => {
    authService.findUserByEmail.mockResolvedValue({
      ...createUser(),
      email: 'test@example.com',
    });
    const dto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(registerUseCase.execute(dto)).rejects.toThrow(
      ConflictException,
    );
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
    isEmailVerified: false,
    mfaEnabled: false,
    mfaMethod: MfaMethod.EMAIL,
    ...overrides,
  };
}
