import { Controller, Post } from '@nestjs/common';

@Controller('auth')
export class AuthController {
    @Post('register')
    async register() {
        // Registration logic here
    }

    @Post('login')
    async login() {
        // Login logic here
    }

    @Post('reset-password')
    async resetPassword() {
        // reset password logic here
    }

    @Post('verify-mfa')
    async verifyMFA() {
        // Enable MFA logic here
    }
}
