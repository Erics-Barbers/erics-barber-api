import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/infrastructure/prisma/auth/auth.repository';
import { TokenService } from 'src/auth/infrastructure/services/token/token.service';

@Injectable()
export class RefreshTokenService {
    constructor(
        private readonly authService: AuthService,
        private readonly tokenService: TokenService,
    ) {}

    async execute(userId: string, refreshToken: string): Promise<void> {
        // Validate refresh token
        await this.authService.invalidateRefreshToken(userId, refreshToken);

        // Additional logic for issuing new tokens can be added here
        
    }
}
