# Project Instructions

## Code efficiency rules

- Work in low-token mode by default.
- Do not scan the whole repository unless explicitly asked.
- Start with targeted `rg` searches before opening files.
- Read only the smallest relevant file ranges needed for the task.
- Do not print full files, full diffs, or long command output unless necessary.
- Prefer path-specific commands such as `git diff -- <path>` over broad commands.
- Run targeted tests first; run full test suites only when the change requires it.
- Before editing, identify the files you intend to touch.
- Make minimal, scoped changes rather than broad refactors.
- Avoid editing generated files unless explicitly instructed.
- Keep final summaries concise: changed files, key decisions, tests run, and remaining risks.

## Documentation

- Update documentation whenever it is useful.
- There is a dedicated documentation folder: `Erics Barbers Docs`.
- Keep docs in that folder updated as auth flows and architecture decisions evolve.

## Git Workflow

- The API, UI, and docs each have their own Git repositories.
- After every code change, commit the relevant changes in each repository that was touched.
- If a task touches multiple repositories, create a separate commit in each touched repository.
- Use a short, descriptive commit message that summarizes the change.
- Keep the commit message to a single clause (for example, "add deploy build scripts").
- Write all commit messages entirely in lower case.
- Do not include unrelated working tree changes in a commit.

## Auth Architecture

- Use the BFF pattern for browser authentication.
- Browser auth flows should call Next.js route handlers under `/api/auth/*`.
- Browser code should not call NestJS auth endpoints directly.
- Next.js route handlers own browser-facing cookies.
- NestJS owns credential validation, token issuing, refresh sessions, and auth rules.

## Generated API Client

- Keep the generated auth client out of browser auth flows.
- It is acceptable to use generated DTO/types.
- Auth behavior should stay in BFF route handlers or a server-only auth helper.
- Do not manually edit `erics-barbers-ui/api/api-spec.json`.
- To update the UI API contract:
  1. Get raw Swagger/OpenAPI JSON from the running Nest API.
  2. Copy it into the UI repo.
  3. Regenerate the UI client.

## Authentication Behavior

- Logout from the UI should redirect to the homepage.
- API logout should be idempotent from the client's perspective.
- Profile access and profile updates should go through the Next.js BFF and participate in refresh-token retry behavior.
- Email changes should not be treated as a basic profile update; they need a separate verification flow.

## MFA

- Build MFA modestly.
- Add `mfaEnabled` to `User`.
- Add `mfaMethod`, initially email-only.
- During login, if MFA is enabled, return `MFA_REQUIRED` instead of access/refresh tokens.
- Store a short-lived MFA challenge.
- Verify the MFA code.
- Only issue access/refresh tokens after MFA succeeds.

## External Providers

- Keep external providers behind a feature flag.
- Use a config flag such as `AUTH_EXTERNAL_PROVIDERS_ENABLED=false`.
- Do not expose provider buttons in the UI unless the flag is enabled.
- Do not build full Google login yet unless explicitly requested.
- Keep the data model open to provider identities later.

## Testing

- Write or update tests whenever you change behavior; treat tests as part of the change, not a follow-up.
- Add tests for new logic, and update or remove tests that a change makes outdated.
- Prioritize unit tests for pure logic and focused tests around fragile auth/BFF/proxy behavior.
- Prefer testing pure, extractable logic directly over asserting through UI or network layers.
- Cover the meaningful cases: expected behavior, edge cases, and failure paths.
- Run the relevant tests after changing code and make them pass before considering the task done.
- If a change genuinely needs no tests, briefly say why in the summary.

## Workflow Preferences

- Explain the context behind auth problems before or while implementing when requested.
- When asked to run lint, run the command and attempt to fix all lint errors.
- Prefer focused tests around fragile auth/BFF/proxy behavior.
