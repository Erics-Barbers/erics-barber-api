export interface TokenService {
  issueTokens(user: any);
  issueEmailVerificationToken(email: string);
  issuePasswordResetToken(email: string);
  verifyToken(token: string);
  verifyRefreshToken(token: string);
}
