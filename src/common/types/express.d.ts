import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      email?: string;
      iat?: number;
      exp?: number;
      role?: string;
      [key: string]: any;
    };
  }
}
