import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { User, Session, Prisma } from '../../../../../generated/prisma/client';
import { BcryptService } from '../../services/bcrypt/bcrypt.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly bcryptService: BcryptService,
    ) {}

    async findUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({ data });
    }

    async validateUserCredentials(email: string, password: string): Promise<User | null> {
        const user = await this.findUserByEmail(email);
        if (!user) return null;
        const isValid = await this.bcryptService.comparePasswords(password, user.passwordHash!);
        return isValid ? user : null;
    }

    async createSession(data: Prisma.SessionCreateInput): Promise<Session> {
        return this.prisma.session.create({ data });
    }

    async invalidateRefreshToken(userId: string, refreshToken: string): Promise<void> {
        await this.prisma.session.deleteMany({
            where: {
                userId,
                refreshToken,
            },
        });
    }
}