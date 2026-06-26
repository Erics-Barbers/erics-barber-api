export interface TokenService {
  issueTokens(user: any, options?: { rememberMe?: boolean });
  issueEmailVerificationToken(email: string);
  issuePasswordResetToken(email: string);
  verifyToken(token: string);
  verifyRefreshToken(token: string);
}
