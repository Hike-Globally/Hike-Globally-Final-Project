/**
 * Unit tests for the Redirections domain rules — the part that decides whether a rule may exist and
 * what a request should do. The proxy, the admin hooks and the CSV import all call these same
 * functions, so a regression here would surface as a wrong redirect on the live site.
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import { canManageRedirections, manageRedirections, REDIRECTIONS_PERMISSION } from '@/access'
import {
  analyseRedirection,
  compileRedirections,
  destinationMatchesSource,
  findRedirection,
  isProtectedPath,
  isStaticAssetPath,
  normaliseDestinationUrl,
  normalisePathForMatch,
  normaliseSourcePath,
  resolveRedirection,
  shouldCheckRedirection,
  toRedirectionRule,
  toStatusCode,
  withQueryString,
  type RedirectionRule,
} from '@/lib/redirections'

const rule = (sourcePath: string, destinationUrl: string, extra: Partial<RedirectionRule> = {}): RedirectionRule => ({
  id: `${sourcePath}-${destinationUrl}`,
  sourcePath,
  destinationUrl,
  statusCode: 301,
  isActive: true,
  ...extra,
})

/* -------------------------------------------------------------------------------------------- */
/* Source normalisation                                                                          */
/* -------------------------------------------------------------------------------------------- */

test('source paths are lowercased, trimmed, and stripped of a trailing slash', () => {
  assert.deepEqual(normaliseSourcePath('  /Old-Page/  '), { ok: true, value: '/old-page', strippedOrigin: undefined })
  assert.deepEqual(normaliseSourcePath('/Trips//Everest-Base-Camp///'), {
    ok: true,
    value: '/trips/everest-base-camp',
    strippedOrigin: undefined,
  })
})

test('a pasted absolute URL is reduced to its path, domain discarded', () => {
  assert.deepEqual(normaliseSourcePath('https://hikeglobally.com/Old-Page/?utm=1#top'), {
    ok: true,
    value: '/old-page',
    strippedOrigin: 'https://hikeglobally.com',
  })
  assert.deepEqual(normaliseSourcePath('http://example.com/legacy'), {
    ok: true,
    value: '/legacy',
    strippedOrigin: 'http://example.com',
  })
  assert.deepEqual(normaliseSourcePath('//example.com/legacy'), {
    ok: true,
    value: '/legacy',
    strippedOrigin: 'https://example.com',
  })
})

test('a source without a leading slash is repaired', () => {
  assert.deepEqual(normaliseSourcePath('old-page'), { ok: true, value: '/old-page', strippedOrigin: undefined })
})

test('invalid, protected and homepage sources are refused with a reason', () => {
  for (const source of ['', '   ', 'javascript:alert(1)', '/a b', '/a\\b']) {
    const result = normaliseSourcePath(source)
    assert.equal(result.ok, false, `expected ${JSON.stringify(source)} to be refused`)
    if (!result.ok) assert.ok(result.error.length > 0)
  }

  for (const protectedPath of ['/', '/admin', '/admin/collections', '/api', '/api/redirections', '/_next/static', '/preview/x', '/sitemap.xml', '/robots.txt']) {
    const result = normaliseSourcePath(protectedPath)
    assert.equal(result.ok, false, `expected ${protectedPath} to be protected`)
  }
})

test('a query string on the source is dropped (matching is path-only)', () => {
  assert.deepEqual(normaliseSourcePath('/old?x=1'), { ok: true, value: '/old', strippedOrigin: undefined })
})

/* -------------------------------------------------------------------------------------------- */
/* Destination validation                                                                        */
/* -------------------------------------------------------------------------------------------- */

test('internal destinations stay internal and external ones must be http(s)', () => {
  assert.deepEqual(normaliseDestinationUrl('/new-page'), {
    ok: true,
    value: '/new-page',
    kind: 'internal',
    internalPath: '/new-page',
  })
  assert.equal(normaliseDestinationUrl('https://example.com/page').ok, true)

  for (const destination of ['', 'example.com', 'javascript:alert(1)', 'data:text/html,x', '//evil.example/x', 'ftp://example.com/x', '/a b']) {
    const result = normaliseDestinationUrl(destination)
    assert.equal(result.ok, false, `expected ${JSON.stringify(destination)} to be refused`)
  }
})

test('destination equal to the source is detected, including a trailing slash or own-domain URL', () => {
  const internal = normaliseDestinationUrl('/old-page/')
  const external = normaliseDestinationUrl('https://hikeglobally.com/Old-Page')
  assert.ok(internal.ok && external.ok)

  assert.equal(destinationMatchesSource('/old-page', internal), true)
  assert.equal(destinationMatchesSource('/old-page', external, 'https://hikeglobally.com'), true)
  assert.equal(destinationMatchesSource('/old-page', external, 'https://another-site.com'), false)
  assert.equal(destinationMatchesSource('/old-page', normaliseDestinationUrl('/new-page') as never), false)
})

/* -------------------------------------------------------------------------------------------- */
/* Full analysis: duplicates, same target, loops, chains                                          */
/* -------------------------------------------------------------------------------------------- */

test('a duplicate source is rejected', () => {
  const analysis = analyseRedirection({ sourcePath: '/Old-Page', destinationUrl: '/new' }, [rule('/old-page', '/a')])
  assert.ok(analysis.errors.sourcePath)
})

test('editing a rule does not report itself as a duplicate', () => {
  const existing = rule('/old-page', '/a', { id: 'existing' })
  const analysis = analyseRedirection(
    { id: 'existing', sourcePath: '/old-page', destinationUrl: '/b' },
    [existing],
  )
  assert.equal(analysis.errors.sourcePath, undefined)
})

test('source and destination being the same URL is rejected', () => {
  const analysis = analyseRedirection({ sourcePath: '/old-page', destinationUrl: '/old-page/' }, [])
  assert.ok(analysis.errors.destinationUrl)
})

test('a direct two-rule loop (A→B, B→A) is blocked with the cycle shown', () => {
  const analysis = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [rule('/b', '/a')])
  assert.ok(analysis.errors.destinationUrl)
  assert.deepEqual(analysis.loop, ['/a', '/b', '/a'])
})

test('a longer loop (A→B, B→C, C→A) is blocked', () => {
  const analysis = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [
    rule('/b', '/c'),
    rule('/c', '/a'),
  ])
  assert.ok(analysis.errors.destinationUrl)
  assert.deepEqual(analysis.loop, ['/a', '/b', '/c', '/a'])
})

test('a redirect to itself through another rule is blocked even when that rule is inactive', () => {
  const loopThroughActive = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [rule('/b', '/a')])
  assert.ok(loopThroughActive.errors.destinationUrl)

  const inactive = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [
    rule('/b', '/a', { isActive: false }),
  ])
  assert.equal(inactive.errors.destinationUrl, undefined)
  assert.equal(inactive.loop, undefined)
})

test('a chain warns and suggests the final destination instead of blocking', () => {
  const analysis = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [
    rule('/b', '/c'),
    rule('/c', '/final'),
  ])

  assert.equal(analysis.errors.destinationUrl, undefined)
  assert.equal(analysis.warnings.length, 1)
  assert.deepEqual(analysis.chain, { via: '/b', finalDestination: '/final' })
})

test('a chain that ends at an external URL warns with that URL', () => {
  const analysis = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [
    rule('/b', 'https://example.com/landing'),
  ])

  assert.equal(analysis.errors.destinationUrl, undefined)
  assert.deepEqual(analysis.chain, { via: '/b', finalDestination: 'https://example.com/landing' })
  assert.match(analysis.warnings[0].message, /example\.com/)
})

test('an internal destination with no rule of its own is neither an error nor a warning', () => {
  const analysis = analyseRedirection({ sourcePath: '/a', destinationUrl: '/b' }, [rule('/elsewhere', '/x')])
  assert.deepEqual(analysis.errors, {})
  assert.deepEqual(analysis.warnings, [])
})

test('a chain through a rule on this site expressed as an absolute URL is detected', () => {
  const analysis = analyseRedirection(
    { sourcePath: '/a', destinationUrl: 'https://hikeglobally.com/b' },
    [rule('/b', '/c')],
    { siteUrl: 'https://hikeglobally.com' },
  )

  assert.deepEqual(analysis.chain, { via: '/b', finalDestination: '/c' })
})

/* -------------------------------------------------------------------------------------------- */
/* Matching                                                                                      */
/* -------------------------------------------------------------------------------------------- */

test('the rule map matches case-insensitively and ignores a trailing slash', () => {
  const compiled = compileRedirections([rule('/Old-Page/', '/new-page')])

  assert.equal(findRedirection(compiled, '/old-page')?.destinationUrl, '/new-page')
  assert.equal(findRedirection(compiled, '/OLD-PAGE/')?.destinationUrl, '/new-page')
  assert.equal(findRedirection(compiled, '/old-page/')?.destinationUrl, '/new-page')
  assert.equal(findRedirection(compiled, '/old-pages'), null)
})

test('inactive rules never match', () => {
  const compiled = compileRedirections([rule('/old', '/new', { isActive: false })])
  assert.equal(findRedirection(compiled, '/old'), null)
})

test('the query string is preserved, and merged when the destination has one', () => {
  assert.equal(withQueryString('/new', ''), '/new')
  assert.equal(withQueryString('/new', '?utm_source=x'), '/new?utm_source=x')
  assert.equal(withQueryString('/new?a=1', '?b=2'), '/new?a=1&b=2')
  assert.equal(withQueryString('https://example.com/x', '?q=1'), 'https://example.com/x?q=1')
})

test('resolveRedirection answers with the stored status code and the full location', () => {
  const compiled = compileRedirections([
    rule('/old', '/new', { statusCode: 308 }),
  ])

  assert.deepEqual(resolveRedirection(compiled, '/old', '?utm=1'), {
    rule: compiled.byPath.get('/old'),
    statusCode: 308,
    location: '/new?utm=1',
  })
})

test('protected paths, the homepage and static assets are never redirect candidates', () => {
  for (const path of ['/', '/admin', '/admin/collections/redirections', '/api/redirections', '/_next/static/a.js', '/images/logo.svg', '/media/file.jpg', '/robots.txt', '/sitemap.xml', '/favicon.ico']) {
    assert.equal(shouldCheckRedirection(path), false, `expected ${path} to skip the redirect lookup`)
  }

  assert.equal(shouldCheckRedirection('/old-page'), true)
  assert.equal(isStaticAssetPath('/blog/post.png'), true)
  assert.equal(isStaticAssetPath('/trips/everest-base-camp'), false)
  assert.equal(isProtectedPath('/apiary'), false)
})

test('a source that is served as a file is refused, because the proxy would never match it', () => {
  for (const path of ['/media/hero.jpg', '/images/logo.svg', '/downloads/guide.pdf', '/app.js']) {
    const result = normaliseSourcePath(path)
    assert.equal(result.ok, false, `expected ${path} to be refused`)
    assert.match((result as { error: string }).error, /static file/)
  }

  // A page path that only looks unusual is still a page path.
  assert.equal(normaliseSourcePath('/trips/everest-base-camp').ok, true)
  assert.equal(normaliseSourcePath('/blog/2026-04-notes').ok, true)
})

/* -------------------------------------------------------------------------------------------- */
/* Stored values                                                                                 */
/* -------------------------------------------------------------------------------------------- */

test('status codes are read from Payload select strings and fall back to 301', () => {
  assert.equal(toStatusCode('308'), 308)
  assert.equal(toStatusCode(302), 302)
  assert.equal(toStatusCode('410'), 301)
  assert.equal(toStatusCode(undefined), 301)
})

test('documents map onto rules; an unusable document is skipped', () => {
  assert.deepEqual(
    toRedirectionRule({ id: 1, sourcePath: '/Old/', destinationUrl: '/new', statusCode: '307', isActive: false }),
    { id: 1, sourcePath: '/old', destinationUrl: '/new', statusCode: 307, isActive: false },
  )
  assert.equal(toRedirectionRule({ id: 2, sourcePath: '/admin', destinationUrl: '/new' }), null)
  assert.equal(toRedirectionRule({ sourcePath: '/a', destinationUrl: '/b' }), null)
})

test('path normalisation for matching decodes and drops query/hash', () => {
  assert.equal(normalisePathForMatch('/Trips/%45verest/?x=1#y'), '/trips/everest')
})

/* -------------------------------------------------------------------------------------------- */
/* Permissions                                                                                   */
/* -------------------------------------------------------------------------------------------- */

test('only the admin role may manage redirections', () => {
  assert.equal(REDIRECTIONS_PERMISSION, 'manage redirections')
  assert.equal(canManageRedirections({ roles: ['admin'] }), true)
  assert.equal(canManageRedirections({ roles: ['editor'] }), false)
  assert.equal(canManageRedirections({ roles: ['admin', 'editor'] }), true)
  assert.equal(canManageRedirections(null), false)

  const as = (roles: string[]) => ({ req: { user: { roles } } }) as never
  assert.equal(manageRedirections(as(['admin'])), true)
  assert.equal(manageRedirections(as(['editor'])), false)
})
