import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.repository';

@Injectable()
export class RegisterUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(email: string, password: string): Promise<void> {
    const data = { email, password };
    await this.authService.createUser(data);
  }
}
