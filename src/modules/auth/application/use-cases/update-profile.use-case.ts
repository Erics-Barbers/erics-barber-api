import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, profileData: any) {
    return await this.authService.updateProfile(userId, profileData);
  }
}
