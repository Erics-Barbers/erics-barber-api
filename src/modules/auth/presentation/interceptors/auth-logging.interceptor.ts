import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

const AUTH_ACTIONS: Record<string, string> = {
  register: 'auth.register',
  sendVerificationEmail: 'auth.send_verification_email',
  verifyEmail: 'auth.verify_email',
  login: 'auth.login',
  getProfile: 'auth.get_profile',
  updateProfile: 'auth.update_profile',
  deleteAccount: 'auth.delete_account',
  logout: 'auth.logout',
  resetPasswordEmail: 'auth.reset_password_email',
  resetPassword: 'auth.reset_password',
  verifyMFA: 'auth.verify_mfa',
  refreshTokens: 'auth.refresh',
};

@Injectable()
export class AuthLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const action = this.getActionName(context);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `${action} succeeded ${this.formatContext(request, startedAt)}`,
        );
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;
        const errorName = error instanceof Error ? error.name : 'UnknownError';

        this.logger.warn(
          `${action} failed status=${statusCode} error=${errorName} ${this.formatContext(
            request,
            startedAt,
          )}`,
        );

        return throwError(() => error);
      }),
    );
  }

  private getActionName(context: ExecutionContext): string {
    return AUTH_ACTIONS[context.getHandler().name] ?? 'auth.unknown';
  }

  private formatContext(request: Request, startedAt: number): string {
    const body = this.getRequestBody(request);
    const email = this.getString(body.email);
    const requestUserId = request.user?.sub;
    const bodyUserId = this.getString(body.userId);
    const userId = requestUserId ?? bodyUserId;
    const duration = Date.now() - startedAt;
    const ip = request.ip ?? request.socket.remoteAddress ?? 'unknown-ip';
    const userAgent = this.truncate(
      this.getHeaderValue(request.headers['user-agent']) ??
        'unknown-user-agent',
      160,
    );
    const refreshCookiePresent = Boolean(request.cookies?.['refreshToken']);
    const contextParts = [
      `method=${request.method}`,
      `path=${request.originalUrl}`,
      `duration=${duration}ms`,
      `ip=${ip}`,
      `userAgent="${userAgent}"`,
    ];

    if (email) {
      contextParts.push(`email=${email.toLowerCase()}`);
    }

    if (userId) {
      contextParts.push(`userId=${userId}`);
    }

    if (refreshCookiePresent) {
      contextParts.push('refreshCookiePresent=true');
    }

    return contextParts.join(' ');
  }

  private getRequestBody(request: Request): Record<string, unknown> {
    if (
      typeof request.body !== 'object' ||
      request.body === null ||
      Array.isArray(request.body)
    ) {
      return {};
    }

    return request.body as Record<string, unknown>;
  }

  private getString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;
  }

  private getHeaderValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    return value;
  }

  private truncate(value: string, maxLength: number) {
    return value.length <= maxLength
      ? value
      : `${value.slice(0, maxLength)}...`;
  }
}
