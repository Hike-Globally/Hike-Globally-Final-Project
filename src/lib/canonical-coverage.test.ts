/**
 * Canonical URL coverage — a guardrail over the routes themselves.
 *
 * Every public page must declare its own canonical URL, and it must be the exact path that page is
 * served at. That is what keeps a page from being indexed as a duplicate of another one, so the
 * rule is enforced here rather than left to memory: add a route without it and `npm test` fails
 * with the name of the file and the one line it needs.
 *
 * Two layers make this hold for pages that do not exist yet:
 *
 *  1. `src/app/(frontend)/layout.tsx` passes a `URL` *instance* as `alternates.canonical`, which
 *     Next.js resolves against the request pathname. Any route — including one that exports no
 *     metadata at all — therefore self-canonicalizes to its own URL by default.
 *  2. Every `page.tsx` states its path explicitly through `buildMetadata({ path })`, which is what
 *     this file checks, so the canonical is visible in the route and correct even when the URL is
 *     built from CMS slugs.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const frontendRoot = path.join(repoRoot, 'src', 'app', '(frontend)')

/** Every file below a directory, recursively. */
const walk = (directory: string, found: string[] = []): string[] => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full, found)
    else found.push(full)
  }
  return found
}

/**
 * The argument list of the first `fn(…)` call in a source file, or null when there is none.
 * Parenthesis counting only — enough for our own call sites, which never contain unbalanced
 * parentheses inside a string literal.
 */
const callArgs = (source: string, fn: string): string | null => {
  const start = source.indexOf(`${fn}(`)
  if (start === -1) return null

  let depth = 0
  for (let index = start + fn.length; index < source.length; index += 1) {
    const char = source[index]
    if (char === '(') depth += 1
    else if (char === ')') {
      depth -= 1
      if (depth === 0) return source.slice(start + fn.length + 1, index)
    }
  }
  return null
}

const relative = (file: string): string => path.relative(repoRoot, file)

const pages = walk(frontendRoot)
  .filter((file) => file.endsWith('page.tsx'))
  .sort()

test('the frontend route group contains the pages this suite expects', () => {
  // Catches a refactor that moves routes out from under this check (and would otherwise let every
  // page silently stop being audited).
  const routes = pages.map((file) => relative(file).replace('src/app/(frontend)', ''))
  assert.ok(pages.length >= 8, `expected at least 8 pages, found ${routes.join(', ')}`)
  assert.ok(
    routes.some((route) => route.includes('/[slug]/page.tsx')),
    'the dynamic detail routes are missing from the audit',
  )
})

test('every page exports metadata built with buildMetadata({ path })', () => {
  const problems: string[] = []

  for (const file of pages) {
    const source = readFileSync(file, 'utf8')
    const name = relative(file)
    // Redirects do not render a page or emit a canonical.
    if (name === 'src/app/(frontend)/inquiry/page.tsx') continue

    if (
      !/export\s+(?:async\s+function\s+generateMetadata|const\s+(?:generateMetadata|metadata)\b)/.test(
        source,
      )
    ) {
      problems.push(`${name}: no \`generateMetadata\`/\`metadata\` export`)
      continue
    }

    const args = callArgs(source, 'buildMetadata')
    if (args === null) {
      problems.push(`${name}: metadata is not built with \`buildMetadata()\` from '@/lib/seo'`)
      continue
    }

    if (!/\bpath:\s*\S/.test(args)) {
      problems.push(`${name}: \`buildMetadata()\` is missing \`path\` — the exact URL of this page`)
      continue
    }

    // The canonical must come from the route itself, never from a CMS field an editor can rewrite.
    if (/\bpath:\s*(?:seo|doc|page|post|trip|destination)\.(?:slug|url)/.test(args)) {
      problems.push(`${name}: \`path\` must be built from the route params, not from content`)
    }
  }

  assert.deepEqual(
    problems,
    [],
    'Every page needs a self-referencing canonical URL:\n' +
      `${problems.map((problem) => `  - ${problem}`).join('\n')}\n` +
      '  Fix: return buildMetadata({ …, path: sitePath(`/the/exact/path`) }) from generateMetadata.',
  )
})

test('the layout canonicalizes by pathname instead of hardcoding one URL', () => {
  const layout = readFileSync(path.join(frontendRoot, 'layout.tsx'), 'utf8')
  const name = relative(path.join(frontendRoot, 'layout.tsx'))

  // A string canonical in a layout is inherited by every route that does not set its own, which
  // stamps one page's URL onto all of them.
  assert.doesNotMatch(
    layout,
    /canonical:\s*(?:['"`]|absoluteUrl\(|canonicalUrl\()/,
    `${name}: the layout must not hardcode a canonical URL — every page would inherit it`,
  )
  assert.match(
    layout,
    /canonical:\s*(?:siteUrlObject|resolveSiteUrlObject\(\))/,
    `${name}: keep \`canonical: resolveSiteUrlObject()\` — Next resolves a URL instance against the ` +
      'request pathname, so pages that export no metadata still canonicalize to their own URL',
  )
})

test('the 404 page emits no canonical at all', () => {
  const notFound = path.join(frontendRoot, 'not-found.tsx')
  const source = readFileSync(notFound, 'utf8')

  // The pathname of a 404 is a URL that does not exist, so it must not be canonicalized to itself.
  assert.match(
    source,
    /canonical:\s*undefined/,
    `${relative(notFound)}: declare \`alternates: { canonical: undefined }\` so the missing URL is ` +
      'not canonicalized to itself',
  )
  assert.match(source, /index:\s*false/, `${relative(notFound)}: the 404 page must be noindex`)
})

test('the sitemap lists exactly the URLs the pages canonicalize to', () => {
  const route = readFileSync(path.join(repoRoot, 'src', 'app', 'sitemap.ts'), 'utf8')
  const builder = readFileSync(path.join(repoRoot, 'src', 'lib', 'sitemap.ts'), 'utf8')

  // The route stays a shell: it reads the content and hands it to the builder, so the rules are
  // testable without a database (see src/lib/sitemap.test.ts) and exist in exactly one place.
  assert.match(
    route,
    /buildSitemap\(/,
    'src/app/sitemap.ts: delegate to buildSitemap() from src/lib/sitemap.ts',
  )
  assert.doesNotMatch(
    route,
    /url:\s*['"`]/,
    'src/app/sitemap.ts: build no URLs in the route itself — buildSitemap() owns the list',
  )

  assert.match(
    builder,
    /url:\s*canonicalUrl\(/,
    'src/lib/sitemap.ts: build entries with canonicalUrl() so a sitemap URL and the canonical of ' +
      'the page it points at are the same string',
  )
  assert.doesNotMatch(
    builder,
    /absoluteUrl\(/,
    'src/lib/sitemap.ts: use canonicalUrl(), not absoluteUrl()',
  )
})
