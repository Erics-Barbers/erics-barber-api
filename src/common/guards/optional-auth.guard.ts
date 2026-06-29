import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { TokenService } from 'src/modules/auth/infrastructure/services/jwt.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return true;
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = await this.tokenService.verifyToken(token);
    if (payload?.tokenType !== 'access' || !payload.sub) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prismaService.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = { ...payload, sub: payload.sub };

    return true;
  }
}
