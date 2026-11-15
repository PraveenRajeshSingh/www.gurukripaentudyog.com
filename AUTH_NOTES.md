# AUTH_NOTES — Phase 1 (Authentication UI)

Honest security / capability notes for the storefront auth shell.  
**Presentation only** — business rules and storage formats were not changed.

## What exists today

| Flow | Status | Notes |
|------|--------|-------|
| Sign In | Live | Server-first via `GBApi.login` when `gb-api-base` is set; else device verifier (`gb_auth_verifiers`, salted SHA-256). |
| Sign Up | Live | Server-first `GBApi.register` when API on; else profile in `gb_users` + local verifier. |
| Forgot / Recover | Honest UI | Opens recover panel with Call / WhatsApp to yard (`+91 91989 23230`). **No email link, no SMS OTP.** |
| OTP Verification | **Not present** | Grep found no OTP / one-time-code auth flow. **Not invented.** |
| Reset Password | UI preview only | Fields exist for review; inputs + submit **disabled**. No Platform API reset endpoint (`docs/PLATFORM-API.md`). |
| Google Sign-In | Conditional | Shown only when `<meta name="google-client-id">` is non-empty; otherwise hidden by `google-auth.js`. |
| Remember me | Live | Controls session persistence via existing `persistUserSession`. |
| Lockout | Live | Client-side after 3 failed attempts; 30s countdown (`failedLoginAttempts` / `startLockoutTimer`). |

## Client-side only checks (not server security)

- Email / mobile format validation on the form
- Password length ≥ 6 (matches existing rule)
- Password strength meter + checklist (length, case, number, symbol) — **UX only**
- Confirm-password match indicator — **UX only**
- Caps Lock hint — **UX only**
- Lockout timer — **browser-local**; a determined user can bypass by clearing state
- Terms checkbox required on register

## Server-side when API is configured

- Password hashing and JWT session are owned by the Platform API
- Optional reCAPTCHA v3 when `recaptcha-site-key` is set
- Failed credentials return 401; conflict on register returns 409

## What is stored in the browser

| Key | Contents | Password? |
|-----|----------|-----------|
| `gb_users` | Profile fields (name, email, mobile) | **No** — `scrubLocalUserSecrets()` strips legacy password fields |
| `gb_auth_verifiers` | Per-email `{ salt, hash, at }` for offline sign-in | Hash only (SHA-256 of salt + password) |
| Session / JWT | Via `GBApi` session helpers when API on | Token, not password |

## Security practices followed in this pass

- Passwords are never logged
- Passwords are not written to `localStorage` in plain text
- Passwords are not placed in URLs
- Sensitive inputs use `type="password"` with show/toggle
- Reset preview cannot submit a fake success

## Local-only messaging

The auth shell shows: passwords are verified by the yard server when connected; the browser never stores plaintext passwords (offline signup stores a salted verifier only).

## Open items (not bugs — missing product features)

1. Self-service password reset API + mail/SMS transport
2. OTP / WebOTP if the business wants phone verification
3. Enable Google by pasting a Web OAuth Client ID
