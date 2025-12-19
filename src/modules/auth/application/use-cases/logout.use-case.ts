import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { LogOutDto } from '../../presentation/dto/logout.dto';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly authService: AuthService) {}

  async execute(dto: LogOutDto): Promise<void> {
    await this.authService.invalidateRefreshToken(dto.userId, dto.refreshToken);
  }
}
