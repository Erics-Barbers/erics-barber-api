export interface TokenService {
  issueTokens(user: any);
  verifyRefreshToken(token: string);
}
