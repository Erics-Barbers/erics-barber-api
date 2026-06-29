import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new UnauthorizedException('User ID (user) not found in token');
    }
    const sub = req.user.sub;
    if (!sub) {
      throw new UnauthorizedException('User ID (sub) not found in token');
    }
    return req.user.sub;
  },
);

export const CurrentUserOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user?.sub;
  },
);

export const CurrentUserRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user?.role) {
      throw new UnauthorizedException('User role not found in token');
    }
    return req.user.role;
  },
);
