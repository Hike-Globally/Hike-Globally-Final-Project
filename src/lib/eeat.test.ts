import assert from 'node:assert/strict'
import { register } from 'node:module'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'

import type { Blog, Media, Setting, Trip, User } from '@/payload-types'
import { authorPath, authorProfile, isIndexableAuthor } from './author-profile'
import { httpUrl } from './http-url'

// Both detail views import section CSS, which is irrelevant to server-markup assertions.
register(
  'data:text/javascript,' +
    encodeURIComponent(
      `export async function resolve(specifier, context, nextResolve) {
         if (specifier.endsWith('.css')) {
           return { url: 'data:text/javascript,export default {}', shortCircuit: true, format: 'module' }
         }
         return nextResolve(specifier, context)
       }`,
    ),
)

process.env.NEXT_PUBLIC_SITE_URL = 'https://hikeglobally.com'
const {
  blogPostingJsonLd,
  organizationId,
  organizationJsonLd,
  personJsonLd,
  profilePageJsonLd,
  touristTripJsonLd,
} = await import('./seo')
const { AuthorProfile } = await import('@/components/content/author-profile')
const { PostDetail } = await import('@/components/views/post-detail')
const { TripDetail } = await import('@/components/views/trip-detail')
const { JsonLd } = await import('@/components/seo/json-ld')

const date = '2026-11-01T00:00:00.000Z'
const avatar: Media = {
  id: 1,
  alt: 'Test author portrait',
  url: '/api/media/file/author.jpg',
  createdAt: date,
  updatedAt: date,
}
// Synthetic test facts only — these are not seeded into the CMS.
const author: User = {
  id: 1,
  name: 'Test Author',
  slug: 'test-author',
  bio: 'Firsthand notes from many seasons on the trail.',
  jobTitle: 'Itinerary writer',
  education: 'Example tourism course, Example College',
  credentials: [{ credential: 'Example guiding qualification' }],
  website: 'https://author.example.com/about',
  socials: [{ platform: 'linkedin', url: 'https://www.linkedin.com/in/example-author' }],
  // Keep Next's image runtime out of plain-Node view tests; populated media is tested below.
  avatar: 1,
  email: 'private-account@example.com',
  hash: 'private-password-hash',
  salt: 'private-password-salt',
  roles: ['editor'],
  collection: 'users',
  createdAt: date,
  updatedAt: date,
}
const post: Blog = {
  id: 1,
  title: 'Test field notes',
  slug: 'test-field-notes',
  excerpt: 'Notes from a trail.',
  author,
  featuredImage: 1,
  pageSections: [{ kind: 'author' }],
  content: {
    root: { type: 'root', children: [], direction: null, format: '', indent: 0, version: 1 },
  },
  createdAt: date,
  updatedAt: date,
}
const trip: Trip = {
  id: 1,
  title: 'Test mountain trek',
  slug: 'test-mountain-trek',
  guide: author,
  pageSections: [{ kind: 'overview' }],
  summary: 'A week in the mountains.',
  heroImage: 1,
  destination: 1,
  tripType: 'trekking',
  durationDays: 7,
  difficulty: 'moderate',
  priceFrom: 900,
  priceCurrency: 'USD',
  createdAt: date,
  updatedAt: date,
}
const settings: Pick<Setting, 'siteName' | 'logo' | 'socials'> = {
  siteName: 'Test Adventures',
  logo: { ...avatar, id: 2, url: '/images/test-logo.svg' },
  socials: [{ platform: 'instagram', url: 'https://www.instagram.com/example-operator' }],
}

function documentOf(html: string) {
  return new JSDOM(html).window.document
}

function schemaNodes(document: Document): Record<string, unknown>[] {
  return [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((script) => {
    const data = JSON.parse(script.textContent ?? '')
    return Array.isArray(data) ? data : [data]
  })
}

const serialized = (data: unknown) => JSON.parse(JSON.stringify(data))

test('public profile URLs accept HTTP(S), not executable, relative or credential-bearing links', () => {
  assert.equal(httpUrl(' https://example.com/about '), 'https://example.com/about')
  assert.equal(httpUrl('http://example.com/profile'), 'http://example.com/profile')
  for (const value of [
    null,
    undefined,
    '',
    ' ',
    '/about',
    '//example.com',
    'example.com',
    'https://',
    'javascript:alert(1)',
    'data:text/html,hello',
    'mailto:person@example.com',
    'https://user:password@example.com/profile',
  ]) {
    assert.equal(httpUrl(value), undefined, String(value))
  }
})

test('public profile normalization trims facts, deduplicates credentials, and filters unsafe links', () => {
  const profile = authorProfile({
    ...author,
    name: ' Test Author ',
    bio: ' Biography ',
    credentials: [
      { credential: ' Qualification ' },
      { credential: 'Qualification' },
      { credential: ' ' },
    ],
    website: 'javascript:alert(1)',
    socials: [
      { platform: 'x', url: 'data:text/html,unsafe' },
      { platform: 'linkedin', url: 'https://example.com/profile' },
      { platform: 'linkedin', url: ' https://example.com/profile ' },
    ],
  })
  assert.equal(profile?.name, 'Test Author')
  assert.equal(profile?.bio, 'Biography')
  assert.deepEqual(profile?.credentials, ['Qualification'])
  assert.equal(profile?.website, undefined)
  assert.deepEqual(profile?.socials, [{ platform: 'linkedin', url: 'https://example.com/profile' }])
})

test('account-only updates do not change the public profile used for cache invalidation', () => {
  assert.deepEqual(
    authorProfile(author),
    authorProfile({
      ...author,
      email: 'changed-private@example.com',
      hash: 'changed-password-hash',
      roles: ['admin'],
      sessions: [{ id: 'session', expiresAt: date }],
    } as User),
  )
  assert.notDeepEqual(authorProfile(author), authorProfile({ ...author, jobTitle: 'New role' }))
})

test('Person structured data contains the supplied public expertise, not account details', () => {
  const person = personJsonLd({ ...author, avatar })!
  assert.equal(person['@type'], 'Person')
  assert.equal(person.name, author.name)
  assert.equal(person.description, author.bio)
  assert.equal(person.jobTitle, author.jobTitle)
  // `url` is the author's page on this site, not their own homepage — see personJsonLd().
  assert.equal(person.url, 'https://hikeglobally.com/authors/test-author')
  assert.equal(person.image, 'https://hikeglobally.com/api/media/file/author.jpg')
  // The personal site and socials are `sameAs`: pointers to the same person elsewhere.
  assert.deepEqual(person.sameAs, [
    author.website,
    ...(author.socials?.map(({ url }) => url) ?? []),
  ])
  assert.deepEqual(person.hasCredential, [
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'education',
      name: author.education,
    },
    {
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'professional credential',
      name: 'Example guiding qualification',
    },
  ])
  assert.doesNotMatch(JSON.stringify(person), /private-|"email"|"hash"|"salt"|"roles"|"sessions"/)
})

test('name-only profiles do not invent expertise and unresolved author IDs are omitted', () => {
  assert.deepEqual(serialized(personJsonLd({ name: 'Pemba' })), {
    '@type': 'Person',
    name: 'Pemba',
  })
  for (const value of [null, undefined, 42, { name: ' ' }]) {
    assert.equal(personJsonLd(value), undefined)
    assert.equal(authorProfile(value), null)
  }
  const person = personJsonLd({ name: 'Pemba', avatar: 42, website: 'javascript:alert(1)' })!
  assert.equal(person.image, undefined)
  assert.equal(person.url, undefined)
  assert.equal(person.hasCredential, undefined)
})

test('Person URL only falls back to an external profile when there is no profile slug', () => {
  // With a slug, the Person node is anchored to the page on this site.
  assert.equal(
    personJsonLd({ ...author, website: null })!.url,
    'https://hikeglobally.com/authors/test-author',
  )
  // Without one — an unresolved or legacy record — it falls back to the first external profile.
  assert.equal(
    personJsonLd({ ...author, slug: null, website: null })!.url,
    author.socials?.[0].url,
  )
  // And with nothing to point at, no `url` is emitted rather than a wrong one.
  assert.equal(
    personJsonLd({ ...author, slug: null, website: null, socials: null })!.url,
    undefined,
  )
})

test('BlogPosting uses the populated author and preserves name-only / unresolved fallbacks', () => {
  const args = { post, url: '/blog/test-field-notes', siteName: settings.siteName }
  assert.deepEqual(blogPostingJsonLd(args).author, personJsonLd(author))
  assert.deepEqual(
    blogPostingJsonLd({ ...args, post: { ...post, author: 42 }, authorName: 'Pemba' }).author,
    { '@type': 'Person', name: 'Pemba' },
  )
  assert.equal(blogPostingJsonLd({ ...args, post: { ...post, author: 42 } }).author, undefined)
  assert.equal(blogPostingJsonLd({ ...args, author: null }).author, undefined)
})

test('Organization identity includes configured logo, contact details and valid social profiles', () => {
  const organization = organizationJsonLd({
    name: settings.siteName,
    legalName: 'Example Operator Ltd',
    url: 'https://hikeglobally.com',
    logo: settings.logo,
    description: 'Independent travel operator.',
    email: 'public@example.com',
    phone: '+977 1 555 0100',
    address: 'Street address\nKathmandu',
    socials: [...settings.socials!, { url: 'javascript:alert(1)' }, ...settings.socials!],
  })
  assert.equal(organization['@id'], organizationId)
  assert.equal(organization['@type'], 'Organization')
  assert.equal(organization.name, settings.siteName)
  assert.equal(organization.legalName, 'Example Operator Ltd')
  assert.equal(organization.logo, 'https://hikeglobally.com/images/test-logo.svg')
  assert.deepEqual(organization.address, {
    '@type': 'PostalAddress',
    streetAddress: 'Street address, Kathmandu',
  })
  assert.deepEqual(organization.contactPoint, {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'public@example.com',
    telephone: '+977 1 555 0100',
    availableLanguage: 'en',
  })
  assert.deepEqual(
    organization.sameAs,
    settings.socials?.map(({ url }) => url),
  )

  const minimal = organizationJsonLd({
    name: 'Operator',
    url: 'https://hikeglobally.com',
    logo: 42,
  })
  assert.equal(minimal.logo, 'https://hikeglobally.com/images/logo.svg')
  assert.equal(minimal.contactPoint, undefined)
  assert.equal(minimal.sameAs, undefined)
  assert.equal(minimal.legalName, undefined)
})

test('blog and trip-page publishers point at the full site-wide Organization', () => {
  const identity = {
    siteName: settings.siteName,
    organizationLogo: settings.logo,
    organizationSocials: settings.socials,
  }
  const publisher = blogPostingJsonLd({
    post,
    url: '/blog/test-field-notes',
    ...identity,
  }).publisher
  const tour = touristTripJsonLd({
    trip,
    url: '/trips/test-mountain-trek',
    ...identity,
  })
  assert.equal(tour.provider, undefined)
  assert.deepEqual((tour.subjectOf as Record<string, unknown>).publisher, publisher)
  assert.deepEqual(publisher, {
    '@type': 'Organization',
    '@id': organizationId,
    name: settings.siteName,
    url: 'https://hikeglobally.com',
    logo: 'https://hikeglobally.com/images/test-logo.svg',
    sameAs: settings.socials?.map(({ url }) => url),
  })
})

test('trip expertise belongs to its describing WebPage, not an unsupported TouristTrip.author', () => {
  const data = touristTripJsonLd({
    trip,
    url: '/trips/test-mountain-trek/',
    siteName: settings.siteName,
  })
  assert.equal(data['@type'], 'TouristTrip')
  assert.equal(data['@id'], 'https://hikeglobally.com/trips/test-mountain-trek#trip')
  assert.equal(data.author, undefined)
  const page = data.subjectOf as Record<string, unknown>
  assert.equal(page['@type'], 'WebPage')
  assert.equal(page['@id'], 'https://hikeglobally.com/trips/test-mountain-trek')
  assert.deepEqual(page.author, personJsonLd(author))
  assert.deepEqual(page.mainEntity, { '@id': data['@id'] })
  assert.equal(data.offers, undefined)
  for (const guide of [undefined, null, 42]) {
    const unattributed = touristTripJsonLd({
      trip: { ...trip, guide },
      url: '/trips/test',
      siteName: settings.siteName,
    })
    const pageWithoutGuide = unattributed.subjectOf as Record<string, unknown>
    assert.equal(pageWithoutGuide.author, undefined)
    assert.deepEqual(pageWithoutGuide.publisher, page.publisher)
  }
})

test('the visible author card renders with just a name, and hides absent expertise labels', () => {
  const document = documentOf(
    renderToStaticMarkup(
      createElement(AuthorProfile, {
        author: { name: 'Pemba' },
        label: 'About the author',
      }),
    ),
  )
  const card = document.querySelector('[data-author-profile]')!
  assert.ok(card)
  assert.equal(card.querySelector('h2')?.textContent, 'Pemba')
  assert.doesNotMatch(
    card.textContent ?? '',
    /Education|Professional credentials|Website|undefined/,
  )
  assert.equal(
    renderToStaticMarkup(createElement(AuthorProfile, { author: 42, label: 'Author' })),
    '',
  )
})

test('blog detail renders the same public expertise in its card and structured data', () => {
  const html = renderToStaticMarkup(createElement(PostDetail, { post, related: [], settings }))
  const document = documentOf(html)
  const card = document.querySelector('[data-author-profile]')!
  assert.ok(card)
  for (const fact of [
    author.name,
    author.bio!,
    author.jobTitle!,
    author.education!,
    author.credentials![0].credential,
  ]) {
    assert.ok(card.textContent?.includes(fact), `${fact} must be visible`)
  }
  assert.equal(card.querySelector('a[rel="author"]')?.getAttribute('href'), '/authors/test-author')
  const article = schemaNodes(document).find((node) => node['@type'] === 'BlogPosting')!
  assert.deepEqual(article.author, serialized(personJsonLd(author)))
  assert.equal(
    (article.publisher as Record<string, unknown>).logo,
    'https://hikeglobally.com/images/test-logo.svg',
  )
  assert.doesNotMatch(html, /private-account|private-password/)
})

test('blog detail preserves name-only cards and does not publish hidden expertise', () => {
  const nameOnly = documentOf(
    renderToStaticMarkup(
      createElement(PostDetail, {
        post: { ...post, author: { ...author, bio: null } },
        related: [],
        settings,
      }),
    ),
  )
  assert.ok(nameOnly.querySelector('[data-author-profile]')?.textContent?.includes(author.name))

  const hidden = documentOf(
    renderToStaticMarkup(
      createElement(PostDetail, {
        post: { ...post, pageSections: [{ kind: 'hero' }] },
        related: [],
        settings,
      }),
    ),
  )
  assert.equal(hidden.querySelector('[data-author-profile]'), null)
  const article = schemaNodes(hidden).find((node) => node['@type'] === 'BlogPosting')!
  assert.deepEqual(article.author, { '@type': 'Person', name: author.name })
})

test('trip detail renders its expert exactly once, including full-width-only layouts', () => {
  for (const pageSections of [trip.pageSections, [{ kind: 'hero' as const }]]) {
    const html = renderToStaticMarkup(
      createElement(TripDetail, {
        trip: { ...trip, pageSections },
        related: [],
        settings,
      }),
    )
    const document = documentOf(html)
    assert.equal(document.querySelectorAll('[data-author-profile]').length, 1)
    assert.ok(document.querySelector('[data-author-profile]')?.textContent?.includes(author.bio!))
    const tour = schemaNodes(document).find((node) => node['@type'] === 'TouristTrip')!
    assert.deepEqual(
      (tour.subjectOf as Record<string, unknown>).author,
      serialized(personJsonLd(author)),
    )
    assert.equal(tour.provider, undefined)
    assert.equal(tour.offers, undefined)
    assert.match(document.body.textContent ?? '', /Hike Globally is a travel affiliate platform/)
    assert.match(document.body.textContent ?? '', /may earn a commission/)
    assert.equal(((tour.subjectOf as Record<string, unknown>).publisher as Record<string, unknown>)['@id'], organizationId)
    assert.doesNotMatch(html, /private-account|private-password/)
  }
  const noGuide = documentOf(
    renderToStaticMarkup(
      createElement(TripDetail, {
        trip: { ...trip, guide: 42 },
        related: [],
        settings,
      }),
    ),
  )
  assert.equal(noGuide.querySelector('[data-author-profile]'), null)
})

test('the trip page keeps its price in the pricing section and publishes no offer', () => {
  const document = documentOf(
    renderToStaticMarkup(createElement(TripDetail, { trip, related: [], settings })),
  )

  // A listing price is not an operator offer: no node on the page may claim to sell the trip.
  // `@type` can be an array, so a node typed `['TouristTrip', 'Product']` fails here as well.
  for (const node of schemaNodes(document)) {
    const types = Array.isArray(node['@type']) ? (node['@type'] as unknown[]) : [node['@type']]
    assert.ok(!types.includes('Offer'), `no Offer node: ${JSON.stringify(types)}`)
    assert.ok(!types.includes('Product'), `no Product node: ${JSON.stringify(types)}`)
    assert.equal(node.offers, undefined, `no offers on a ${JSON.stringify(types)} node`)
  }

  // The price is still published — as the pricing section's own text, which is the one place a
  // visitor can read it. `formatPrice(900, 'USD')`.
  assert.match(document.body.textContent ?? '', /\$900/)
})

test('profile text cannot break out of JSON-LD or produce executable profile links', () => {
  const malicious = {
    ...author,
    // No slug, so the card has no internal profile link to render — the test asserts that
    // nothing *executable* is emitted, not that the byline is unlinked.
    slug: null,
    bio: '</script><script>alert(1)</script>',
    website: 'javascript:alert(1)',
    socials: null,
  }
  const html = renderToStaticMarkup(createElement(JsonLd, { data: personJsonLd(malicious)! }))
  const document = documentOf(html)
  assert.equal(document.querySelectorAll('script').length, 1)
  assert.equal(schemaNodes(document)[0].description, malicious.bio)
  const cardHtml = renderToStaticMarkup(
    createElement(AuthorProfile, { author: malicious, label: 'Author' }),
  )
  const card = documentOf(cardHtml)
  assert.equal(card.querySelector('script'), null)
  assert.equal(card.querySelector('a'), null)
})

test('authorPath resolves the internal profile address and nothing for an unresolved author', () => {
  assert.equal(authorPath(author), '/authors/test-author')
  // Whitespace is trimmed, so a slug pasted with a stray space still forms a valid URL.
  assert.equal(authorPath({ slug: '  pemba-sherpa  ' }), '/authors/pemba-sherpa')
  for (const value of [null, undefined, 42, { slug: null }, { slug: '   ' }]) {
    assert.equal(authorPath(value), null, String(value))
  }
})

test('ProfilePage anchors the same Person node the byline and BlogPosting emit', () => {
  const page = profilePageJsonLd({
    author,
    url: '/authors/test-author',
    siteName: settings.siteName,
  })

  assert.equal(page['@context'], 'https://schema.org')
  assert.equal(page['@type'], 'ProfilePage')
  // `canonicalUrl()` normalizes the trailing slash away, exactly like the page's own canonical.
  assert.equal(page.url, 'https://hikeglobally.com/authors/test-author')
  assert.equal(page.name, `Test Author — ${settings.siteName}`)
  assert.deepEqual(page.mainEntity, personJsonLd(author))
  assert.equal((page.publisher as Record<string, unknown>)['@id'], organizationId)
  // The identity must never leak account fields, even on the page dedicated to the author.
  assert.doesNotMatch(JSON.stringify(page), /private-|\"email\"|\"hash\"|\"salt\"|\"roles\"|\"sessions\"/)
})

test('only an author with a bio or published work earns an indexed page', () => {
  assert.equal(isIndexableAuthor(author), true, 'a bio is enough')
  assert.equal(isIndexableAuthor({ ...author, bio: null }), false, 'a bare account is not')
  assert.equal(isIndexableAuthor({ ...author, bio: null }, { posts: 1 }), true)
  assert.equal(isIndexableAuthor({ ...author, bio: null }, { trips: 1 }), true)
  assert.equal(isIndexableAuthor({ ...author, bio: null }, { posts: 0, trips: 0 }), false)
  assert.equal(isIndexableAuthor(null), false)
  assert.equal(isIndexableAuthor(42), false)
})
