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
- `refreshToken`: HttpOnly browser cookie, 12 hour lifetime by default, or 7 days when the user selects "keep me signed in".

The API returns `refreshMaxAgeSeconds` with token responses so the BFF can set the browser-facing refresh cookie to the same lifetime as the backend refresh session. The API also sets an API-domain refresh cookie for compatibility, but the browser-facing cookie that matters to the UI is set by Next.js.

## Request Validation

The API uses a strict global `ValidationPipe` configured in `src/config/validation.ts`.

Important behavior:

- request bodies and query strings are transformed into DTO instances
- unexpected properties are rejected instead of silently accepted
- decorated query values, such as pagination numbers, are converted to their expected primitive types
- validation errors hide the submitted object/value to avoid echoing sensitive input

Every request DTO should decorate every accepted property. With whitelist validation enabled, an undecorated DTO property is treated as not part of the public API contract.

## Refresh Rotation

Refresh tokens are rotated. A successful refresh does this:

1. Verify the submitted refresh token.
2. Confirm it matches a stored session hash in the user's unexpired session history.
3. Issue a new access token and refresh token.
4. Hash the new refresh token.
5. In one database transaction, mark the old session as rotated, create the new session in the same family, and link the old session to its replacement.
6. Return both tokens to the BFF only after the transaction commits.

This makes refresh tokens one-use while retaining enough session history to detect replay.

If an already-rotated refresh token is submitted again, the API treats it as replay and revokes the active sessions in that session family.

## Logout

Logout is idempotent from the client perspective. A missing, malformed, wrong-type, expired, or already-revoked refresh token still produces a successful logout response after the API clears its refresh cookie.

When a valid refresh token is present, the API invalidates the matching refresh-token session in PostgreSQL.

The UI also clears local auth cookies even if the API logout call fails. This keeps the user experience reliable.

## Password Reset

Password reset is a two-step flow:

1. `POST /auth/reset-password-email` accepts an email address and an optional `surface`.
2. The API sends a reset link if the user exists, while still returning a generic success response either way.
3. `POST /auth/reset-password` accepts the reset token and new password.

Supported reset surfaces:

| Surface    | Reset link base URL |
| ---------- | ------------------- |
| `CUSTOMER` | `CLIENT_BASE_URL`   |
| `STAFF`    | `STAFF_CLIENT_BASE_URL`, falling back to `CLIENT_BASE_URL` if unset |

The frontend BFF chooses the surface from the customer or staff reset form. The API never accepts arbitrary reset redirect URLs from the browser.

## Rate Limits

The app has a global `100/min` throttling default, with tighter limits on auth-sensitive endpoints:

| Endpoint                             |  Limit |
| ------------------------------------ | -----: |
| `POST /auth/register`                |  5/min |
| `POST /auth/login`                   | 10/min |
| `POST /auth/send-verification-email` | 3/hour |
| `POST /auth/verify-email`            | 10/min |
| `POST /auth/reset-password-email`    | 3/hour |
| `POST /auth/reset-password`          | 10/min |
| `POST /auth/verify-mfa`              | 10/min |
| `POST /auth/refresh`                 | 30/min |
| `POST /auth/logout`                  | 30/min |

Email-sending endpoints are intentionally the tightest because they can create external side effects through the email provider.

## Unverified Account Cleanup

Unverified customer accounts are removed by a scheduled backend job.

Default policy:

- run daily at 2am server time
- delete users where `isEmailVerified = false`
- only delete `CUSTOMER` users
- only delete users older than 7 days

The retention window can be changed with:

```text
UNVERIFIED_USER_TTL_DAYS=7
```

This keeps abandoned registrations from accumulating while giving users time to find the verification email or request another one.

## Expired Auth State Cleanup

Expired refresh sessions and MFA challenges are removed by a scheduled backend job.

Default policy:

- run daily at 3am server time
- delete `Session` rows where `expiresAt` is in the past
- delete `MfaChallenge` rows where `expiresAt` is in the past

`Session.expiresAt` and `MfaChallenge.expiresAt` are indexed so cleanup can scan expired rows efficiently.

## MFA

MFA is implemented as a modest email-code flow.

Users can enable or disable MFA through authenticated API calls to:

```text
PUT /auth/mfa-preference
```

When `User.mfaEnabled = true`, login behaves differently:

1. The API validates email/password.
2. The API creates a short-lived `MfaChallenge` with a hashed 6-digit code.
3. The raw code is sent to the user's email.
4. Login returns `code: MFA_REQUIRED`, the `challengeId`, and the MFA method.
5. No access token, refresh token, or session is created yet.
6. The client submits the challenge id and code to `POST /auth/verify-mfa`.
7. The API verifies the code, consumes the challenge, creates the refresh session, and returns access/refresh tokens.

Only `EMAIL` MFA is currently supported. The code expires after 10 minutes. If the user selected "keep me signed in" before the MFA step, that preference is stored on the MFA challenge and applied only after MFA succeeds.

## External Providers

External provider login is not implemented yet. The database has `ExternalAccount` for future provider identities, and provider UI/API work should remain hidden unless the relevant feature flag is enabled.

Default flag:

```text
AUTH_EXTERNAL_PROVIDERS_ENABLED=false
```
