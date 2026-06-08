import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Token payloads and result types
export interface AccessTokenPayload {
  sub?: string;
  email: string;
  iat: number;
  exp: number;
  role?: string;
  tokenType: string;
}

export interface RefreshTokenPayload {
  sub?: string;
  iat: number;
  exp: number;
  tokenType: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserTokenInfo {
  id: string;
  email: string;
}

@Injectable()
export class TokenService {
  private readonly secret = process.env.JWT_SECRET!;
  private readonly defaultExpiresIn = '1h';
  private readonly jwtService: JwtService;

  constructor() {
    this.jwtService = new JwtService({ secret: this.secret });
  }

  async signToken(
    payload:
      | Omit<AccessTokenPayload, 'iat' | 'exp'>
      | Omit<RefreshTokenPayload, 'iat' | 'exp'>,
    options?: { expiresIn?: string },
  ): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp =
      iat + this.parseExpiresIn(options?.expiresIn || this.defaultExpiresIn);
    return await this.jwtService.signAsync({ ...payload, iat, exp });
  }

  async generateTokens(email: string): Promise<TokenPair> {
    const accessToken = await this.signToken(
      { email, tokenType: 'access' },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.signToken(
      { email, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  async issueTokens(user: UserTokenInfo): Promise<TokenPair> {
    const accessToken = await this.signToken(
      { sub: user.id, email: user.email, tokenType: 'access' },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.signToken(
      { sub: user.id, tokenType: 'refresh' },
      { expiresIn: '7d' },
    );
    return { accessToken, refreshToken };
  }

  async verifyToken(
    token: string,
  ): Promise<AccessTokenPayload | RefreshTokenPayload | null> {
    try {
      const decoded = await this.jwtService.verifyAsync<
        AccessTokenPayload | RefreshTokenPayload
      >(token);
      return decoded;
    } catch {
      return null;
    }
  }

  decodeToken(token: string): AccessTokenPayload | RefreshTokenPayload | null {
    try {
      const decoded = this.jwtService.decode<
        AccessTokenPayload | RefreshTokenPayload
      >(token);
      if (decoded && typeof decoded === 'object') {
        return decoded;
      }
      return null;
    } catch {
      return null;
    }
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
