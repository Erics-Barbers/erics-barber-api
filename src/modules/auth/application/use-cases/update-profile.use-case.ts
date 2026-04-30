import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { UserProfile } from 'src/common/types/profile';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, profileData: any): Promise<UserProfile> {
    return await this.authService.updateProfile(userId, profileData);
  }
}
