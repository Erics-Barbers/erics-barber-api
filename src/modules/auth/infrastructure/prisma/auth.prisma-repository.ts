import { Injectable } from '@nestjs/common';
import { BcryptService } from '../services/bcrypt.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { User, Session, Prisma } from 'src/generated/prisma/client';
import { ResendService } from 'src/infrastructure/mail/resend.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly resendService: ResendService,
  ) {}

  async getProfile(userId: string): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
      },
    });
    return user;
  }

  async updateProfile(userId: string, profileData: any): Promise<any> {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: profileData,
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
    return updatedUser;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prismaService.user.create({ data });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prismaService.user.delete({ where: { id: userId } });
  }

  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await this.bcryptService.comparePasswords(
      password,
      user.passwordHash!,
    );
    return isValid ? user : null;
  }

  async createSession(data: Prisma.SessionCreateInput): Promise<Session> {
    return await this.prismaService.session.create({ data });
  }

  async invalidateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prismaService.session.deleteMany({
      where: {
        userId,
        refreshToken,
      },
    });
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const passwordHash = await this.bcryptService.hashPassword(newPassword);
    await this.prismaService.user.update({
      where: { email },
      data: { passwordHash },
    });
  }

  async enableMfa(userId: string, mfaSecret: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { mfaSecret } as Prisma.UserUpdateInput,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationLink = `https://erics-barbers-luton.co.uk/verify-email?token=${token}`;
    const subject = 'Verify Your Email';
    const emailContent = `
      <h1>Email Verification</h1>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationLink}">Verify Email</a>
    `;
    await this.resendService.sendEmail(email, subject, emailContent);
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const resetLink = `https://erics-barbers-luton.co.uk/reset-password?token=${token}`;
    const subject = 'Reset Your Password';
    const emailContent = `
      <h1>Password Reset</h1>
      <p>You can reset your password by clicking the link below:</p>
      <a href="${resetLink}">Reset Password</a>
    `;
    await this.resendService.sendEmail(email, subject, emailContent);
  }
}
