import { User } from './user';

export class Session {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly refreshToken: string,
    public readonly userAgent: string,
    public readonly ipAddress: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly User: User,
  ) {}
}
