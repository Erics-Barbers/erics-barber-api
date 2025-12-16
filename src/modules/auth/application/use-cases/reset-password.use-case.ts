import { Injectable } from "@nestjs/common";
import { AuthService } from "../../infrastructure/prisma/auth.repository";

@Injectable()
export class ResetPasswordUseCase {
    constructor(private readonly authService: AuthService) {}
    async execute(userId: string, refreshToken: string): Promise<void> {
        await this.authService.resetpassword(userId, refreshToken);
    }
}