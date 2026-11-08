/**
 * Redirections — the domain rules behind the SEO → Redirections module.
 *
 * Everything in this file is pure: no Payload, no Next.js, no environment access. That is
 * deliberate, because the same rules are asked three different questions by three different
 * callers, and they must never disagree:
 *
 *   1. the Payload `beforeValidate` hook — "may this rule be saved?" (throws field errors)
 *   2. the admin form's live "chain / loop" hint — "what will this rule do?" (warnings only)
 *   3. the request proxy — "does this incoming path redirect?" (must be a cheap map lookup)
 *
 * The normalisation rules are the contract between those three:
 *
 *   source   lowercased, one leading slash, no duplicate or trailing slash, no query/hash, and a
 *            pasted absolute URL is reduced to its path — `/Old-Page/` and `https://site.com/old-page`
 *            are the same source, so a duplicate can never slip in through a different spelling.
 *   match    the incoming path is normalised the same way, so the trailing slash is ignored when
 *            matching and `/OLD-PAGE` still hits a rule stored as `/old-page`.
 *   target   either an internal path (starts with `/`) or an absolute `http(s)` URL. Anything else
 *            — `javascript:`, `data:`, `//evil.example` — never reaches a visitor's address bar.
 */

export const REDIRECT_STATUS_CODES = [301, 302, 307, 308] as const

export type RedirectStatusCode = (typeof REDIRECT_STATUS_CODES)[number]

/** The same four values as Payload stores them — a select field's value is a string. */
export type RedirectStatusCodeString = '301' | '302' | '307' | '308'

export const DEFAULT_REDIRECT_STATUS_CODE: RedirectStatusCode = 301

/** Options for the status-code dropdown, in the order an editor expects to read them. */
export const REDIRECT_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: '301 — Permanent', value: '301' },
  { label: '302 — Temporary', value: '302' },
  { label: '307 — Temporary (keeps method)', value: '307' },
  { label: '308 — Permanent (keeps method)', value: '308' },
]

/**
 * Paths that belong to the application, not to the content. A rule may never redirect *from* one
 * of these: `/admin` would lock every editor out of the CMS and `/api/…` would break the admin's
 * own requests. `/` is protected for the same reason — a self-inflicted homepage redirect takes the
 * whole storefront down — and the generated routes are protected because redirecting them breaks
 * crawlers, analytics and the sitemap.
 */
export const PROTECTED_PATH_PREFIXES = ['/admin', '/api', '/_next', '/preview'] as const

export const PROTECTED_EXACT_PATHS = [
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/ads.txt',
  '/favicon.ico',
] as const

/** Extensions that are always served as files, never as pages. */
const STATIC_ASSET_EXTENSIONS = [
  'css',
  'js',
  'mjs',
  'map',
  'json',
  'txt',
  'xml',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'avif',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'mp4',
  'webm',
  'pdf',
  'zip',
] as const

/** Directories that only ever hold files (media, design assets, Next.js chunks). */
const STATIC_ASSET_PREFIXES = ['/_next/', '/images/', '/media/'] as const

export type RedirectionRule = {
  id: number | string
  sourcePath: string
  destinationUrl: string
  statusCode: number
  isActive?: boolean
}

export type CompiledRedirections = {
  rules: RedirectionRule[]
  byPath: Map<string, RedirectionRule>
}

export type RedirectionFieldErrors = {
  sourcePath?: string
  destinationUrl?: string
  statusCode?: string
}

export type RedirectionWarning = {
  field?: keyof RedirectionFieldErrors
  message: string
}

export type RedirectionAnalysis = {
  /** Normalised values, always present (even when `errors` is non-empty). */
  sourcePath: string
  destinationUrl: string
  statusCode: number
  errors: RedirectionFieldErrors
  warnings: RedirectionWarning[]
  /** The cycle, as the paths a visitor would bounce between. */
  loop?: string[]
  /** A→B where B→C exists: the admin is told to point A straight at C. */
  chain?: { via: string; finalDestination: string }
}

export type RedirectionCandidate = {
  id?: number | string | null
  sourcePath?: unknown
  destinationUrl?: unknown
  statusCode?: unknown
  isActive?: unknown
}

const isPresent = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const normaliseWhitespace = (value: string): string => value.trim()

/** Collapses `//` runs outside the scheme and strips a trailing slash (except for the root). */
const tidyPath = (path: string): string => {
  const collapsed = path.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed
}

export const isRedirectStatusCode = (value: unknown): value is RedirectStatusCode =>
  REDIRECT_STATUS_CODES.includes(Number(value) as RedirectStatusCode)

/** Payload stores the status code as a select value (`'301'`); the redirect needs a number. */
export const toStatusCode = (value: unknown): RedirectStatusCode => {
  const numeric = Number(value)
  return isRedirectStatusCode(numeric) ? numeric : DEFAULT_REDIRECT_STATUS_CODE
}

/** True for a path that is not ours to redirect: admin, API, generated routes, the homepage. */
export const isProtectedPath = (pathname: string): boolean => {
  const path = tidyPath(normalisePathForMatch(pathname))
  if (!path) return false
  if ((PROTECTED_EXACT_PATHS as readonly string[]).includes(path)) return true
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/** True for a file request (chunk, image, font, feed) — never worth a redirect lookup. */
export const isStaticAssetPath = (pathname: string): boolean => {
  if (!pathname) return false
  const path = pathname.toLowerCase()
  if (STATIC_ASSET_PREFIXES.some((prefix) => path.startsWith(prefix))) return true

  const lastSegment = path.split('/').pop() ?? ''
  const dot = lastSegment.lastIndexOf('.')
  if (dot <= 0) return false

  return (STATIC_ASSET_EXTENSIONS as readonly string[]).includes(lastSegment.slice(dot + 1))
}

/**
 * The single normal form used for *matching*: decode, drop query/hash, collapse slashes, lowercase,
 * remove the trailing slash. `/Trips/Everest-Base-Camp/?x=1` → `/trips/everest-base-camp`.
 */
export const normalisePathForMatch = (input: string): string => {
  let path = input.split('?')[0].split('#')[0]

  try {
    path = decodeURI(path)
  } catch {
    // A malformed escape sequence is not a path we can match; use it verbatim.
  }

  if (!path.startsWith('/')) path = `/${path}`
  return tidyPath(path.toLowerCase())
}

export type NormalisedSource =
  | { ok: true; value: string; strippedOrigin?: string }
  | { ok: false; error: string }

/**
 * Normalises `source_path`, including a pasted absolute URL (the domain is dropped, as the redirect
 * matches on the path only). Returns an error rather than throwing so the admin gets the message on
 * the field.
 */
export const normaliseSourcePath = (input: unknown): NormalisedSource => {
  if (!isPresent(input)) {
    return { ok: false, error: 'Enter the path on this site to redirect, e.g. /old-page.' }
  }

  const raw = normaliseWhitespace(input)
  let path = raw
  let strippedOrigin: string | undefined

  // A full URL pasted into the source field: keep the path, throw the domain away.
  const absolute = /^https?:\/\//i.test(raw) ? raw : /^\/\//.test(raw) ? `https:${raw}` : null
  if (absolute) {
    let url: URL
    try {
      url = new URL(absolute)
    } catch {
      return { ok: false, error: 'That is not a valid URL. Paste a path such as /old-page.' }
    }
    if (!url.hostname) {
      return { ok: false, error: 'That URL has no domain. Paste a path such as /old-page.' }
    }
    strippedOrigin = url.origin
    path = url.pathname
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    return { ok: false, error: 'Only paths and http(s) URLs are supported as a source.' }
  }

  // Path only: a query string or hash cannot be matched, so it is dropped with the domain.
  path = path.split('?')[0].split('#')[0]

  if (path.includes('\\')) {
    return { ok: false, error: 'Use forward slashes (/) in the path.' }
  }
  if (/[\s\u0000-\u001f\u007f]/.test(path)) {
    return { ok: false, error: 'The path cannot contain spaces or control characters.' }
  }

  const normalised = tidyPath((path.startsWith('/') ? path : `/${path}`).toLowerCase())

  if (normalised === '/') {
    return { ok: false, error: 'The homepage (/) cannot be redirected.' }
  }
  if ((PROTECTED_EXACT_PATHS as readonly string[]).includes(normalised)) {
    return { ok: false, error: `${normalised} is a system route and cannot be redirected.` }
  }
  if (isProtectedPath(normalised)) {
    return { ok: false, error: `${normalised} is a system route and cannot be redirected.` }
  }

  // `/media/…`, `/images/…` and anything with a file extension are served as bytes by the app (or
  // straight from the CDN) and never reach a page route, so the proxy never matches them. Storing
  // such a rule would look like it works while quietly doing nothing.
  if (isStaticAssetPath(normalised)) {
    return { ok: false, error: `${normalised} is a static file, not a page, and cannot be redirected.` }
  }

  return { ok: true, value: normalised, strippedOrigin }
}

export type NormalisedDestination =
  | { ok: true; value: string; kind: 'internal' | 'external'; internalPath?: string }
  | { ok: false; error: string }

/**
 * Validates and normalises `destination_url`: an internal path on this site, or a full http(s) URL.
 * Protocol-relative (`//host`) and non-http schemes are rejected — an admin typo must not become a
 * way to send visitors somewhere the field never claimed to allow.
 */
export const normaliseDestinationUrl = (input: unknown): NormalisedDestination => {
  if (!isPresent(input)) {
    return { ok: false, error: 'Enter the destination path or URL.' }
  }

  const raw = normaliseWhitespace(input)

  if (/[\s\u0000-\u001f\u007f]/.test(raw)) {
    return { ok: false, error: 'The destination cannot contain spaces or control characters.' }
  }
  if (raw.startsWith('//')) {
    return { ok: false, error: 'Include the scheme, e.g. https://example.com/page.' }
  }
  if (raw.includes('\\')) {
    return { ok: false, error: 'Use forward slashes (/) in the destination.' }
  }

  if (raw.startsWith('/')) {
    const path = raw.split('#')[0]
    return { ok: true, value: path.replace(/\/{2,}/g, '/'), kind: 'internal', internalPath: normalisePathForMatch(path) }
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return {
      ok: false,
      error: 'Enter a path starting with / or a full http(s) URL, e.g. https://example.com/page.',
    }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs can be used as a destination.' }
  }
  if (!url.hostname) {
    return { ok: false, error: 'That URL has no domain.' }
  }

  return { ok: true, value: url.toString(), kind: 'external' }
}

const originOf = (siteUrl?: string): string | null => {
  if (!siteUrl) return null
  try {
    return new URL(siteUrl).origin.toLowerCase()
  } catch {
    return null
  }
}

/**
 * True when the destination resolves to the same URL as the source — including an absolute URL on
 * this site (`https://hikeglobally.com/old-page` for source `/old-page`) and a trailing-slash
 * variant of the same path.
 */
export const destinationMatchesSource = (
  sourcePath: string,
  destination: { value: string; kind: 'internal' | 'external'; internalPath?: string },
  siteUrl?: string,
): boolean => {
  const source = normalisePathForMatch(sourcePath)

  if (destination.kind === 'internal') {
    return normalisePathForMatch(destination.value) === source
  }

  const site = originOf(siteUrl)
  try {
    const url = new URL(destination.value)
    if (site && url.origin.toLowerCase() !== site) return false
    return normalisePathForMatch(url.pathname) === source
  } catch {
    return false
  }
}

/** Maps a Payload document onto the shape the proxy and the analyses use. */
export const toRedirectionRule = (doc: {
  id?: number | string | null
  sourcePath?: string | null
  destinationUrl?: string | null
  statusCode?: string | number | null
  isActive?: boolean | null
}): RedirectionRule | null => {
  if (doc.id === undefined || doc.id === null) return null
  const source = normaliseSourcePath(doc.sourcePath ?? '')
  if (!source.ok) return null
  if (!isPresent(doc.destinationUrl)) return null

  return {
    id: doc.id,
    sourcePath: source.value,
    destinationUrl: doc.destinationUrl.trim(),
    statusCode: toStatusCode(doc.statusCode),
    isActive: doc.isActive !== false,
  }
}

/** Builds the lookup map once per cache load, not once per request. */
export const compileRedirections = (rules: RedirectionRule[]): CompiledRedirections => {
  const byPath = new Map<string, RedirectionRule>()

  for (const rule of rules) {
    if (rule.isActive === false) continue
    const path = normalisePathForMatch(rule.sourcePath)
    // First rule wins: the database has a unique index on the source path, so a duplicate here can
    // only come from an old row that predates it.
    if (!byPath.has(path)) byPath.set(path, rule)
  }

  return { rules, byPath }
}

/** The rule (if any) that answers this incoming path. Match on the path only. */
export const findRedirection = (
  compiled: CompiledRedirections,
  pathname: string,
): RedirectionRule | null => {
  if (!pathname) return null
  return compiled.byPath.get(normalisePathForMatch(pathname)) ?? null
}

/**
 * Appends the visitor's query string to the destination, keeping it by default.
 * `?utm_source=x` survives `/old` → `/new`; a destination that already has one gets `&`.
 */
export const withQueryString = (destination: string, search: string): string => {
  const query = search.startsWith('?') ? search.slice(1) : search
  if (!query) return destination
  if (destination.endsWith('?')) return `${destination}${query}`
  return destination.includes('?') ? `${destination}&${query}` : `${destination}?${query}`
}

/** Only GET/HEAD page requests are candidates; assets, admin, API and the homepage never are. */
export const shouldCheckRedirection = (pathname: string): boolean => {
  if (!pathname || !pathname.startsWith('/')) return false
  if (isStaticAssetPath(pathname)) return false
  return !isProtectedPath(pathname)
}

export type RedirectionMatch = {
  rule: RedirectionRule
  statusCode: RedirectStatusCode
  /** Where to send the visitor, query string included. */
  location: string
}

/**
 * Answers one incoming request. This is the function the proxy runs on page traffic: a normalised
 * `Map` lookup, then a string join — no I/O.
 */
export const resolveRedirection = (
  compiled: CompiledRedirections,
  pathname: string,
  search = '',
): RedirectionMatch | null => {
  if (!shouldCheckRedirection(pathname)) return null

  const rule = findRedirection(compiled, pathname)
  if (!rule) return null

  return {
    rule,
    statusCode: toStatusCode(rule.statusCode),
    location: withQueryString(rule.destinationUrl, search),
  }
}

const MAX_CHAIN_HOPS = 25

/**
 * Full analysis of a rule that is about to be saved.
 *
 * - **Duplicate** — another rule already owns the normalised source path.
 * - **Same target** — the destination is the source (including a trailing-slash variant).
 * - **Loop** — following the destinations of the active rules returns to the source. Blocked.
 * - **Chain** — the destination is itself redirected somewhere else: a warning that suggests
 *   pointing this rule straight at the end of the chain instead (one hop for the visitor, and the
 *   SEO signal lands on the final URL directly).
 */
export const analyseRedirection = (
  candidate: RedirectionCandidate,
  existingRules: RedirectionRule[],
  options: { siteUrl?: string } = {},
): RedirectionAnalysis => {
  const errors: RedirectionFieldErrors = {}
  const warnings: RedirectionWarning[] = []

  const source = normaliseSourcePath(candidate.sourcePath)
  const destination = normaliseDestinationUrl(candidate.destinationUrl)
  const statusCode = toStatusCode(candidate.statusCode)

  if (!source.ok) errors.sourcePath = source.error
  if (!isRedirectStatusCode(candidate.statusCode) && candidate.statusCode !== undefined) {
    errors.statusCode = 'Choose 301, 302, 307 or 308.'
  }

  if (!destination.ok) {
    errors.destinationUrl = destination.error
  } else if (source.ok && destinationMatchesSource(source.value, destination, options.siteUrl)) {
    errors.destinationUrl = 'The destination is the same as the source path.'
  }

  const sourcePath = source.ok ? source.value : ''
  const destinationUrl = destination.ok ? destination.value : ''

  if (!source.ok || !destination.ok) {
    return { sourcePath, destinationUrl, statusCode, errors, warnings }
  }

  // Other rules by normalised source, ignoring the document being edited.
  const byPath = new Map<string, RedirectionRule>()
  for (const rule of existingRules) {
    if (candidate.id !== undefined && candidate.id !== null && String(rule.id) === String(candidate.id)) {
      continue
    }
    byPath.set(normalisePathForMatch(rule.sourcePath), rule)
  }

  const duplicate = byPath.get(sourcePath)
  if (duplicate) {
    errors.sourcePath = 'Another redirection already uses this path.'
  }

  // Walk the chain, following internal destinations through the existing active rules.
  const activeByPath = new Map<string, RedirectionRule>()
  for (const rule of existingRules) {
    if (rule.isActive === false) continue
    if (candidate.id !== undefined && candidate.id !== null && String(rule.id) === String(candidate.id)) {
      continue
    }
    activeByPath.set(normalisePathForMatch(rule.sourcePath), rule)
  }

  // An absolute destination on this site is walked exactly like an internal one.
  let walkPath: string | null = null
  if (destination.kind === 'internal') {
    walkPath = normalisePathForMatch(destination.value)
  } else {
    const site = originOf(options.siteUrl)
    if (site) {
      try {
        const url = new URL(destination.value)
        if (url.origin.toLowerCase() === site) walkPath = normalisePathForMatch(url.pathname)
      } catch {
        // Already validated above.
      }
    }
  }

  if (walkPath === null) {
    return { sourcePath, destinationUrl, statusCode, errors, warnings }
  }

  const trail: string[] = [sourcePath]
  const seen = new Set<string>([sourcePath])
  let current = walkPath
  let via: string | null = null
  let finalDestination: string | null = null

  for (let index = 0; index < MAX_CHAIN_HOPS; index += 1) {
    if (current === sourcePath) {
      errors.destinationUrl = 'This creates a redirect loop.'
      return {
        sourcePath,
        destinationUrl,
        statusCode,
        errors,
        warnings,
        loop: [...trail, sourcePath],
      }
    }
    if (seen.has(current)) break // A loop between existing rules, not caused by this one.
    seen.add(current)
    trail.push(current)

    const next = activeByPath.get(current)
    if (!next) break // The chain ends here: nothing else redirects this path.

    const target = normaliseDestinationUrl(next.destinationUrl)
    if (!target.ok) break

    if (via === null) via = current
    finalDestination = target.value

    if (target.kind === 'external') break
    current = target.internalPath ?? normalisePathForMatch(target.value)
  }

  // A two-hop redirect still works, so this is advice rather than an error: send the visitor (and
  // the search-engine signal) straight to the end of the chain.
  if (via !== null && finalDestination !== null && finalDestination !== destination.value) {
    warnings.push({
      field: 'destinationUrl',
      message:
        `“${sourcePath}” points at “${destination.value}”, which is redirected again. Point this ` +
        `rule straight at “${finalDestination}” so visitors take one hop instead of two.`,
    })
    return {
      sourcePath,
      destinationUrl,
      statusCode,
      errors,
      warnings,
      chain: { via, finalDestination },
    }
  }

  return { sourcePath, destinationUrl, statusCode, errors, warnings }
}

export const hasRedirectionErrors = (analysis: RedirectionAnalysis): boolean =>
  Object.keys(analysis.errors).length > 0
