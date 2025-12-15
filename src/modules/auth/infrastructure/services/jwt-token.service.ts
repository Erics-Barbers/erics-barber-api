import { Injectable } from '@nestjs/common';
import { SignJWT, jwtVerify, decodeJwt, JWTPayload } from 'jose';

@Injectable()
export class TokenService {
  private readonly secret = process.env.JWT_SECRET || 'defaultSecret';
  private readonly defaultExpiresIn = '1h';

  private getJwtSecret(): Uint8Array {
    return new TextEncoder().encode(this.secret);
  }

  async signToken(
    payload: object,
    options?: { expiresIn?: string },
  ): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp =
      iat + this.parseExpiresIn(options?.expiresIn || this.defaultExpiresIn);

    return await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(this.getJwtSecret());
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getJwtSecret());
      return payload;
    } catch {
      return null;
    }
  }

  decodeToken(token: string): JWTPayload | null {
    try {
      return decodeJwt(token);
    } catch {
      return null;
    }
  }

  async issueTokens(user: { id: string; email: string }) {
    const accessToken = await this.signToken(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.signToken(
      { sub: user.id },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  // Helper to parse '1h', '15m', etc. to seconds
  private parseExpiresIn(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 3600; // default 1h
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 3600;
    }
  }
}
