import { resolveSiteUrl } from './site-url'

/**
 * The browser origins this app trusts for CORS and CSRF validation.
 *
 * Single source of truth, shared by:
 *  - `payload.config.ts`, which installs the list as Payload's `cors` / `csrf` allowlist, and
 *  - `middleware.ts`, which must leave requests from these origins untouched so Payload's own
 *    validation keeps deciding them exactly as before.
 *
 * `localhost:3000` is listed unconditionally: it is where `next dev` serves the admin, and a
 * production build never receives traffic from it.
 *
 * This module must stay dependency-free (no Payload imports) — the middleware bundle loads it.
 */
export const trustedOrigins = (
  env: Record<string, string | undefined> = process.env,
): string[] => [resolveSiteUrl(env), 'http://localhost:3000'].filter(Boolean)
