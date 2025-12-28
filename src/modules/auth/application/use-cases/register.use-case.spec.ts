import { ConflictException } from '@nestjs/common';
import { RegisterUseCase } from './register.use-case';
import { RegisterDto } from '../../presentation/dto/register.dto';

describe('RegisterUseCase', () => {
  let registerUseCase: RegisterUseCase;
  let authService: any;
  let bcryptService: any;
  let tokenService: any;

  beforeEach(() => {
    authService = {
      findUserByEmail: jest.fn(),
      createUser: jest.fn(),
      sendVerificationEmail: jest.fn(),
    };
    bcryptService = {
      hashPassword: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
    };
    registerUseCase = new RegisterUseCase(
      authService,
      bcryptService,
      tokenService,
    );
  });

  it('should register a user successfully', async () => {
    authService.findUserByEmail.mockResolvedValue(null);
    bcryptService.hashPassword.mockResolvedValue('hashedPassword');
    tokenService.generateTokens.mockResolvedValue({ accessToken: 'token' });
    authService.createUser.mockResolvedValue(undefined);
    authService.sendVerificationEmail.mockResolvedValue(undefined);

    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(registerUseCase.execute(dto)).resolves.toBeUndefined();
    expect(authService.findUserByEmail).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(bcryptService.hashPassword).toHaveBeenCalledWith('Password1');
    expect(authService.createUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      passwordHash: 'hashedPassword',
    });
    expect(tokenService.generateTokens).toHaveBeenCalledWith(
      'test@example.com',
    );
    expect(authService.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'token',
    );
  });

  it('should throw ConflictException if email is already in use', async () => {
    authService.findUserByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password1',
    };
    await expect(registerUseCase.execute(dto)).rejects.toThrow(
      ConflictException,
    );
  });

  // Add more tests as needed for error cases, etc.
});
