# Authentication

This API owns credential validation, token issuing, refresh sessions, profile access, email verification, password reset, and auth-related rate limiting.

The browser should not call these endpoints directly for normal UI auth flows. The Next.js UI acts as the BFF and calls this API from server-side route handlers/proxy code, then sets browser cookies on the UI domain.

## Token Types

JWTs include a `tokenType` claim so tokens cannot be reused for the wrong purpose:

- `access`: short-lived bearer token for protected API requests.
- `refresh`: long-lived token used only to rotate/refresh sessions.
- `emailVerification`: token sent in email verification links.
- `passwordReset`: token sent in password reset links.

Protected API routes must accept only `access` tokens. Email verification and password reset use cases must reject normal access/refresh tokens.

## Browser Cookie Flow

The API returns access and refresh tokens to trusted server-side clients such as the Next.js BFF.

The BFF stores:

- `accessToken`: HttpOnly browser cookie, 15 minute lifetime.
- `refreshToken`: HttpOnly browser cookie, 7 day lifetime.

The API also sets an API-domain refresh cookie for compatibility, but the browser-facing cookie that matters to the UI is set by Next.js.

## Refresh Rotation

Refresh tokens are rotated. A successful refresh does this:

1. Verify the submitted refresh token.
2. Confirm it matches an active stored session hash.
3. Invalidate the old refresh session.
4. Issue a new access token and refresh token.
5. Store the new refresh token hash as a new session.
6. Return both tokens to the BFF.

This makes refresh tokens one-use. Reusing an old refresh token should fail.

Future hardening: make the invalidation/create step transactional, and consider session-family replay detection so reuse of an old rotated token can revoke related sessions.

## Logout

The UI clears local auth cookies even if the API logout call fails. This keeps the user experience reliable.

Future hardening: make the API logout endpoint idempotent too. A missing, expired, or already-revoked refresh token should still result in a successful logout response after clearing the cookie.

## Rate Limits

The app has a global `100/min` throttling default, with tighter limits on auth-sensitive endpoints:

| Endpoint | Limit |
| --- | ---: |
| `POST /auth/register` | 5/min |
| `POST /auth/login` | 10/min |
| `POST /auth/send-verification-email` | 3/hour |
| `POST /auth/verify-email` | 10/min |
| `POST /auth/reset-password-email` | 3/hour |
| `POST /auth/reset-password` | 10/min |
| `POST /auth/verify-mfa` | 10/min |
| `POST /auth/refresh` | 30/min |
| `POST /auth/logout` | 30/min |

Email-sending endpoints are intentionally the tightest because they can create external side effects through the email provider.

## MFA Status

MFA is not a complete flow yet. The current endpoint is a placeholder/foundation and is not integrated into login.

A complete MFA flow should:

1. Validate email/password.
2. If MFA is enabled, return an MFA-required response without issuing full tokens.
3. Verify the MFA code.
4. Issue access/refresh tokens only after MFA succeeds.
