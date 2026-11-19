/**
 * Structured-data coverage — the schema.org counterpart to `canonical-coverage.test.ts`.
 *
 * Every public page must describe itself to search engines with JSON-LD, and it must be the right
 * kind of node: a trip is a `TouristTrip` with an offer, a post is a `BlogPosting`, a listing is a
 * `CollectionPage` whose `ItemList` is the cards the page actually renders. Rich results are built
 * from this markup, so a page that silently stops emitting it loses them with nothing failing in
 * the build — which is why the rule is enforced here.
 *
 * The markup for a detail page lives in the view component it renders (`TripDetail`, `PostDetail`,
 * `DestinationDetail`) rather than in the route file, so this audit follows the route's own
 * `@/components/…` imports instead of only reading `page.tsx`.
 *
 * Run with: npm test
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '../..')
const frontendRoot = path.join(repoRoot, 'src', 'app', '(frontend)')

const relative = (file: string): string => path.relative(repoRoot, file)

/** Every file below a directory, recursively. */
const walk = (directory: string, found: string[] = []): string[] => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(full, found)
    else found.push(full)
  }
  return found
}

/** Resolve an `@/…` import to a file on disk (`.tsx` or `.ts`, index files included). */
const resolveImport = (specifier: string): string | null => {
  if (!specifier.startsWith('@/')) return null
  const base = path.join(repoRoot, 'src', specifier.slice(2))

  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

/**
 * The source of a page plus the source of every component it imports, so markup rendered by a
 * child component still counts as the page's own.
 */
const sourceWithImports = (file: string): string => {
  const source = readFileSync(file, 'utf8')
  const parts = [source]

  for (const match of source.matchAll(/from\s+'(@\/[^']+)'/g)) {
    const resolved = resolveImport(match[1]!)
    if (resolved) parts.push(readFileSync(resolved, 'utf8'))
  }

  return parts.join('\n')
}

/** Route → the JSON-LD builders that must be reachable from it. */
const expectedStructuredData: Record<string, string[]> = {
  'src/app/(frontend)/layout.tsx': ['organizationJsonLd'],
  'src/app/(frontend)/page.tsx': ['websiteJsonLd'],
  'src/app/(frontend)/[slug]/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/trips/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/trips/[slug]/page.tsx': ['breadcrumbJsonLd', 'touristTripJsonLd'],
  'src/app/(frontend)/blog/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/blog/[slug]/page.tsx': ['breadcrumbJsonLd', 'blogPostingJsonLd'],
  'src/app/(frontend)/destinations/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/destinations/[slug]/page.tsx': [
    'breadcrumbJsonLd',
    'touristDestinationJsonLd',
  ],
  'src/app/(frontend)/inquiry/page.tsx': [], // permanent redirect
  'src/app/(frontend)/about/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/contact/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/privacy/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  'src/app/(frontend)/terms/page.tsx': ['breadcrumbJsonLd', 'webPageJsonLd'],
  // Deliberately empty: the page is `noindex` and describes nothing worth indexing.
  'src/app/(frontend)/inquiry/thank-you/page.tsx': [],
}

const pages = walk(frontendRoot)
  .filter((file) => file.endsWith('page.tsx'))
  .map(relative)
  .sort()

test('the audit covers every frontend page', () => {
  // A route added later without an entry here would otherwise go un-audited.
  const missing = pages.filter((page) => !(page in expectedStructuredData))
  assert.deepEqual(
    missing,
    [],
    'Every page needs an entry in expectedStructuredData:\n' +
      `${missing.map((page) => `  - ${page}`).join('\n')}`,
  )
})

test('every page renders the structured data its route calls for', () => {
  const problems: string[] = []

  for (const [page, builders] of Object.entries(expectedStructuredData)) {
    if (builders.length === 0) continue

    const file = path.join(repoRoot, page)
    const source = sourceWithImports(file)

    if (!source.includes('<JsonLd')) {
      problems.push(`${page}: renders no <JsonLd> at all`)
      continue
    }

    for (const builder of builders) {
      if (!source.includes(`${builder}(`)) {
        problems.push(`${page}: missing \`${builder}()\``)
      }
    }
  }

  assert.deepEqual(
    problems,
    [],
    'Every page needs schema.org markup:\n' +
      `${problems.map((problem) => `  - ${problem}`).join('\n')}\n` +
      '  Fix: render <JsonLd data={[…]} /> from "@/components/seo/json-ld" with the builders in ' +
      '"@/lib/seo".',
  )
})

test('the shared layout publishes organization identity without a duplicate homepage entity', () => {
  const layout = readFileSync(path.join(frontendRoot, 'layout.tsx'), 'utf8')
  const home = readFileSync(path.join(frontendRoot, 'page.tsx'), 'utf8')
  assert.match(layout, /<JsonLd[\s\S]*?organizationJsonLd\(/)
  for (const field of ['siteName', 'legalName', 'logo', 'email', 'phone', 'address', 'socials']) {
    assert.ok(layout.includes(`settings.${field}`), `Organization must read settings.${field}`)
  }
  assert.doesNotMatch(home, /organizationJsonLd\(/)
})

test('structured data never receives a relative image URL', () => {
  // schema.org drops a relative image (and the Rich Results Test flags it). The `*JsonLd()`
  // builders resolve Media documents through `schemaImageUrl()`, so a call site must hand them the
  // document — never `media.url`.
  const files = [...walk(frontendRoot), ...walk(path.join(repoRoot, 'src', 'components'))].filter(
    (file) => file.endsWith('.tsx'),
  )

  const problems = files
    .filter((file) => /image:\s*[^,\n]*\.url/.test(readFileSync(file, 'utf8')))
    .map(relative)

  assert.deepEqual(
    problems,
    [],
    'Pass the Media document to JSON-LD, not its `.url` — schema.org requires an absolute URL:\n' +
      `${problems.map((problem) => `  - ${problem}`).join('\n')}`,
  )
})

test('the detail routes publish the Keywords section', () => {
  // Trips and Blog documents carry a "Keywords" section (src/fields/keywords.ts). It has to reach
  // the page: `<meta name="keywords">` through buildMetadata, and `keywords` through the JSON-LD.
  for (const page of [
    'src/app/(frontend)/trips/[slug]/page.tsx',
    'src/app/(frontend)/blog/[slug]/page.tsx',
  ]) {
    const source = readFileSync(path.join(repoRoot, page), 'utf8')

    assert.match(
      source,
      /buildMetadata\(\{[\s\S]*?keywords:\s*seo\.keywords/,
      `${page}: pass \`keywords: seo.keywords\` to buildMetadata()`,
    )
  }

  // And the field itself must exist on both collections.
  for (const collection of ['Trips', 'Blog']) {
    const source = readFileSync(
      path.join(repoRoot, 'src', 'collections', `${collection}.ts`),
      'utf8',
    )

    assert.match(
      source,
      /keywordsSection\(\)/,
      `src/collections/${collection}.ts: include the Keywords section (keywordsSection())`,
    )
  }
})
