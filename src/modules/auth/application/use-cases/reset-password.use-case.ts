import { Injectable } from '@nestjs/common';
import { AuthService } from '../../infrastructure/prisma/auth.prisma-repository';
import { ResetPasswordDto } from '../../presentation/dto/reset-password.dto';

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly authService: AuthService) {}
  async execute(dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto.email, dto.newPassword);
  }
}
