/* eslint-disable prettier/prettier */
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string;
      email?: string;
      iat?: number;
      exp?: number;
      // optionally add role later if you include it in JWT
      // role?: "ADMIN" | "BARBER" | "CUSTOMER";
      [key: string]: any;
    };
  }
}
