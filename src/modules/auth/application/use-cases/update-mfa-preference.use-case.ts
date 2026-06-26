import { Injectable } from '@nestjs/common';
import { MfaMethod } from 'src/generated/prisma/client';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { MfaPreferenceDto } from '../../presentation/dto/mfa-preference.dto';

@Injectable()
export class UpdateMfaPreferenceUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(userId: string, dto: MfaPreferenceDto): Promise<void> {
    await this.authService.setMfaPreference(
      userId,
      dto.enabled,
      dto.method ?? MfaMethod.EMAIL,
    );
  }
}
