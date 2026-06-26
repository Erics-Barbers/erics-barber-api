import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const { method, originalUrl } = request;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown-ip';
    const userAgentHeader = request.headers['user-agent'];
    const userAgent = Array.isArray(userAgentHeader)
      ? userAgentHeader.join(', ')
      : (userAgentHeader ?? 'unknown-user-agent');

    response.on('finish', () => {
      const duration = Date.now() - startedAt;
      const message = `${method} ${originalUrl} ${response.statusCode} ${duration}ms - ${ip} - ${userAgent}`;

      if (response.statusCode >= 500) {
        this.logger.error(message);
      } else if (response.statusCode >= 400) {
        this.logger.warn(message);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
