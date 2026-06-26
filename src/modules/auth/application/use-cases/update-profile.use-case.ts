import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { UserProfile } from 'src/common/types/profile';
import { UpdateProfileDto } from '../../presentation/dto/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(
    userId: string,
    profileData: UpdateProfileDto,
  ): Promise<UserProfile> {
    return await this.authService.updateProfile(userId, {
      name: profileData.name.trim(),
    });
  }
}
