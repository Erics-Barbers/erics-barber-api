import { UserProfile } from 'src/common/types/profile';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly authService: AuthService) {}
  async execute(userId: string): Promise<UserProfile> {
    return await this.authService.getProfile(userId);
  }
}
