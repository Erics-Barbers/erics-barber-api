import { Injectable, NotFoundException } from '@nestjs/common';
import { BcryptService } from '../services/bcrypt.service';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { User, Prisma, Session } from 'src/generated/prisma/client';
import { Role, SessionRevocationReason } from 'src/generated/prisma/enums';
import { ResendService } from 'src/infrastructure/mail/resend.service';
import { UserProfile } from 'src/common/types/profile';
import { UserUpdateInput } from 'src/generated/prisma/models';

type MfaMethod = 'EMAIL';

type MfaChallenge = {
  id: string;
  userId: string;
  codeHash: string;
  method: MfaMethod;
  rememberMe: boolean;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

type MfaChallengeDelegate = {
  deleteMany(args: { where: { expiresAt: { lt: Date } } }): Promise<{
    count: number;
  }>;
  create(args: {
    data: {
      user: { connect: { id: string } };
      codeHash: string;
      method: MfaMethod;
      rememberMe: boolean;
      expiresAt: Date;
    };
  }): Promise<MfaChallenge>;
  findUnique(args: { where: { id: string } }): Promise<MfaChallenge | null>;
  update(args: {
    where: { id: string };
    data: { consumedAt: Date };
  }): Promise<MfaChallenge>;
};

type AuthTransactionClient = {
  session: {
    create(args: { data: Prisma.SessionCreateInput }): Promise<unknown>;
  };
  mfaChallenge: Pick<MfaChallengeDelegate, 'update'>;
};

const DEFAULT_MFA_METHOD: MfaMethod = 'EMAIL';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly bcryptService: BcryptService,
    private readonly resendService: ResendService,
  ) {}

  private get mfaChallengeDelegate(): MfaChallengeDelegate {
    return (
      this.prismaService as unknown as {
        mfaChallenge: MfaChallengeDelegate;
      }
    ).mfaChallenge;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        isEmailVerified: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    profileData: UserUpdateInput,
  ): Promise<UserProfile> {
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: profileData,
      select: {
        name: true,
        id: true,
        email: true,
        isEmailVerified: true,
        updatedAt: true,
      },
    });
    if (!updatedUser) throw new NotFoundException('Current user not found');
    return updatedUser;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { email } });
  }

  async findUserById(userId: string): Promise<User | null> {
    return await this.prismaService.user.findUnique({ where: { id: userId } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prismaService.user.create({ data });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prismaService.user.delete({ where: { id: userId } });
  }

  async deleteUnverifiedCustomersCreatedBefore(cutoff: Date): Promise<number> {
    const result = await this.prismaService.user.deleteMany({
      where: {
        isEmailVerified: false,
        role: Role.CUSTOMER,
        createdAt: { lt: cutoff },
      },
    });

    return result.count;
  }

  async deleteExpiredSessions(referenceDate = new Date()): Promise<number> {
    const result = await this.prismaService.session.deleteMany({
      where: {
        expiresAt: { lt: referenceDate },
      },
    });

    return result.count;
  }

  async deleteExpiredMfaChallenges(
    referenceDate = new Date(),
  ): Promise<number> {
    const result = await this.mfaChallengeDelegate.deleteMany({
      where: {
        expiresAt: { lt: referenceDate },
      },
    });

    return result.count;
  }

  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;
    const isValid = await this.bcryptService.compareHashedInput(
      password,
      user.passwordHash!,
    );
    return isValid ? user : null;
  }

  async createSession(data: Prisma.SessionCreateInput): Promise<void> {
    await this.prismaService.session.create({ data });
  }

  async rotateRefreshTokenSession(
    oldSessionId: string,
    newSessionData: Prisma.SessionCreateInput,
  ): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const revokedAt = new Date();
      await tx.session.update({
        where: { id: oldSessionId },
        data: {
          revokedAt,
          revokedReason: SessionRevocationReason.ROTATED,
        },
      });
      const newSession = await tx.session.create({ data: newSessionData });
      await tx.session.update({
        where: { id: oldSessionId },
        data: { replacedBySessionId: newSession.id },
      });
    });
  }

  async createMfaChallenge(data: {
    userId: string;
    codeHash: string;
    method: MfaMethod;
    rememberMe: boolean;
    expiresAt: Date;
  }): Promise<MfaChallenge> {
    return await this.mfaChallengeDelegate.create({
      data: {
        user: { connect: { id: data.userId } },
        codeHash: data.codeHash,
        method: data.method,
        rememberMe: data.rememberMe,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findMfaChallengeById(
    challengeId: string,
  ): Promise<MfaChallenge | null> {
    return await this.mfaChallengeDelegate.findUnique({
      where: { id: challengeId },
    });
  }

  async consumeMfaChallenge(challengeId: string): Promise<void> {
    await this.mfaChallengeDelegate.update({
      where: { id: challengeId },
      data: { consumedAt: new Date() },
    });
  }

  async completeMfaChallenge(
    challengeId: string,
    sessionData: Prisma.SessionCreateInput,
  ): Promise<void> {
    await this.prismaService.$transaction(async (tx) => {
      const transactionClient = tx as unknown as AuthTransactionClient;

      await transactionClient.session.create({ data: sessionData });
      await transactionClient.mfaChallenge.update({
        where: { id: challengeId },
        data: { consumedAt: new Date() },
      });
    });
  }

  async findSession(refreshToken: string): Promise<Session | null> {
    return await this.prismaService.session.findUnique({
      where: { refreshToken },
    });
  }

  async findSessionsByUserId(userId: string): Promise<Session[]> {
    return await this.prismaService.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
        revokedAt: null,
      },
    });
  }

  async findRefreshTokenSessionCandidatesByUserId(
    userId: string,
  ): Promise<Session[]> {
    return await this.prismaService.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revokeRefreshTokenSessionFamily(
    familyId: string,
    reason: SessionRevocationReason = SessionRevocationReason.REPLAY_DETECTED,
  ): Promise<number> {
    const result = await this.prismaService.session.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    return result.count;
  }

  async invalidateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const sessions = await this.findSessionsByUserId(userId);
    const matchingSession = await Promise.any(
      sessions.map(async (session) => {
        const isTokenValid = await this.bcryptService.compareHashedInput(
          refreshToken,
          session.refreshToken,
        );

        if (!isTokenValid) {
          throw new Error('Session does not match refresh token');
        }

        return session;
      }),
    ).catch(() => null);

    if (!matchingSession) return;

    await this.prismaService.session.delete({
      where: { id: matchingSession.id },
    });
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const passwordHash = await this.bcryptService.hashInput(newPassword);
    await this.prismaService.user.update({
      where: { email },
      data: { passwordHash },
    });
  }

  async setMfaPreference(
    userId: string,
    enabled: boolean,
    method: MfaMethod = DEFAULT_MFA_METHOD,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { mfaEnabled: enabled, mfaMethod: method },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const clientBaseUrl = process.env.CLIENT_BASE_URL;
    const verificationLink = `${clientBaseUrl}/email-verify?token=${token}`;
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

  async sendResetPasswordEmail(
    email: string,
    token: string,
    surface = 'CUSTOMER',
  ): Promise<void> {
    const clientBaseUrl =
      surface === 'STAFF'
        ? process.env.STAFF_CLIENT_BASE_URL || process.env.CLIENT_BASE_URL
        : process.env.CLIENT_BASE_URL;
    const resetLink = `${clientBaseUrl}/reset-password?token=${token}`;
    const subject = 'Reset Your Password';
    const emailContent = `
      <h1>Password Reset</h1>
      <p>You can reset your password by clicking the link below:</p>
      <a href="${resetLink}">Reset Password</a>
    `;
    await this.resendService.sendEmail(email, subject, emailContent);
  }

  async sendMfaCodeEmail(email: string, code: string): Promise<void> {
    const subject = "Your Eric's Barbers login code";
    const emailContent = `
      <h1>Login Code</h1>
      <p>Your login code is:</p>
      <p><strong>${code}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `;
    await this.resendService.sendEmail(email, subject, emailContent);
  }
}
