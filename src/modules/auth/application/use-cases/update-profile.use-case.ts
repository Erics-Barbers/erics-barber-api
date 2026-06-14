import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { UserProfile } from 'src/common/types/profile';
import { UserUpdateInput } from 'src/generated/prisma/models';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(
    userId: string,
    profileData: UserUpdateInput,
  ): Promise<UserProfile> {
    return await this.authService.updateProfile(userId, profileData);
  }
}
