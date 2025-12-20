import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { MfaDto } from '../../presentation/dto/mfa.dto';

@Injectable()
export class EnableMfaUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(dto: MfaDto): Promise<void> {
    await this.authService.enableMfa(dto.userId, dto.mfaCode);
  }
}
