/* eslint-disable prettier/prettier */
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
