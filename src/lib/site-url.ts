/**
 * Site URL resolution — shared by the frontend and by `payload.config.ts`.
 *
 * `NEXT_PUBLIC_SITE_URL` is easy to set wrong (a bare `hikeglobally.com` with no scheme is the
 * classic mistake). The value is fed to `new URL()` in several places — `metadataBase`, Payload's
 * `serverURL`, CORS/CSRF origins, canonical and OG URLs — and a schemeless value makes `new URL()`
 * throw, which fails `next build` during prerender. Rather than trusting the env var, everything
 * goes through `normalizeSiteUrl()` so a bare hostname is repaired instead of taking the build down.
 *
 * This module must stay dependency-free: `payload.config.ts` is loaded outside the React tree and
 * `src/components/forms/inquiry-form.tsx` is a client component, so nothing here may import
 * server-only code or Payload.
 */

/** Used when nothing better is available. Keeps local `next build` working with no env file. */
export const DEFAULT_SITE_URL = 'http://localhost:3000'

/** Hosts that are never HTTPS, so we don't guess `https://localhost:3000`. */
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

const isLocalHost = (host: string): boolean => {
  // Strip any port: `localhost:3000` → `localhost`.
  const hostname = host.split(':', 1)[0]?.toLowerCase() ?? ''
  return LOCAL_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')
}

/**
 * True only for a fully-qualified `http(s)` URL. Deliberately stricter than "parses as a URL":
 * `new URL('localhost:3000')` happily reports the protocol `localhost:`, so anything that isn't
 * explicitly http(s) is treated as a bare host and gets a protocol added.
 */
const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** Matches a leading `scheme:`, used to spot values carrying the wrong kind of protocol. */
const HAS_ANY_SCHEME = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

/**
 * Matches `host:1234` — a bare host with a port, which looks like a scheme but isn't one.
 * Without this exemption `localhost:3000` would be rejected for having the "scheme" `localhost`.
 */
const IS_HOST_WITH_PORT = /^[^\s:/?#]+:\d+(?:[/?#].*)?$/

/** Emitted once per distinct value, so a bad env var is visible in build logs but not spammy. */
const warned = new Set<string>()
const warnOnce = (value: string, reason: string): void => {
  if (warned.has(value)) return
  warned.add(value)
  console.warn(
    `[site-url] NEXT_PUBLIC_SITE_URL=${JSON.stringify(value)} is not usable (${reason}). ` +
      `Falling back to a local URL — set it to a full origin such as "https://hikeglobally.com".`,
  )
}

/**
 * Turns any user-supplied site URL into a guaranteed-parseable absolute origin, or falls back.
 *
 * - `hikeglobally.com`             → `https://hikeglobally.com`
 * - `hikeglobally.com/`            → `https://hikeglobally.com`
 * - `//hikeglobally.com`           → `https://hikeglobally.com`
 * - `localhost:3000`               → `http://localhost:3000`
 * - `https://hikeglobally.com/app` → unchanged (a path is preserved)
 * - `postgres://…` / garbage / `''`→ `fallback`
 */
export const normalizeSiteUrl = (
  raw?: string | null,
  fallback: string = DEFAULT_SITE_URL,
): string => {
  const candidate = (raw ?? '').trim()
  if (!candidate) return fallback

  // Drop any leading slashes from protocol-relative or accidentally-slashed values.
  const trimmed = candidate.replace(/^\/+/, '')

  // An explicit non-http scheme (`postgres://`, `ftp://`, …) is never a site URL. Bail out instead
  // of mangling it into something that parses but points nowhere.
  if (HAS_ANY_SCHEME.test(trimmed) && !IS_HOST_WITH_PORT.test(trimmed) && !isHttpUrl(trimmed)) {
    warnOnce(candidate, 'only http:// and https:// are supported')
    return fallback
  }

  const host = trimmed.split(/[/?#]/, 1)[0] ?? ''
  const protocol = isLocalHost(host) ? 'http' : 'https'
  const withProtocol = isHttpUrl(trimmed) ? trimmed : `${protocol}://${trimmed}`

  try {
    const url = new URL(withProtocol)
    // `new URL()` normalizes and always yields a trailing slash for origin-only values; strip it so
    // concatenations like `${siteUrl}/sitemap.xml` never produce a double slash.
    const normalized = url.toString().replace(/\/$/, '')
    if (!normalized) {
      warnOnce(candidate, 'could not be parsed')
      return fallback
    }
    return normalized
  } catch {
    warnOnce(candidate, 'could not be parsed')
    return fallback
  }
}

/**
 * Reads the canonical origin from the environment, preferring an explicit `NEXT_PUBLIC_SITE_URL`
 * and otherwise deriving one from the Vercel-provided deployment host.
 */
export const resolveSiteUrl = (
  env: Record<string, string | undefined> = process.env,
  fallback: string = DEFAULT_SITE_URL,
): string => {
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL
  return normalizeSiteUrl(
    env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : ''),
    fallback,
  )
}

/**
 * Same as `resolveSiteUrl()` but returns a `URL` object, or `undefined` if the value is unusable.
 * Use this at call sites that previously did `new URL(siteUrl)` so a bad value degrades to
 * "no metadataBase" instead of crashing the render.
 */
export const resolveSiteUrlObject = (
  env: Record<string, string | undefined> = process.env,
  fallback: string = DEFAULT_SITE_URL,
): URL | undefined => {
  try {
    return new URL(resolveSiteUrl(env, fallback))
  } catch {
    return undefined
  }
}
