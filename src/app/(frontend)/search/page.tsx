import type { Metadata } from 'next'
import Link from 'next/link'

import { DestinationCard } from '@/components/cards/destination-card'
import { PostCard } from '@/components/cards/post-card'
import { TripCard } from '@/components/cards/trip-card'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHeader } from '@/components/sections/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sitePath } from '@/i18n/config'
import { dictionary, plural, t } from '@/i18n/dictionaries'
import { getDestinations, getPosts, getTrips, type TripCard as TripCardData } from '@/lib/data'
import { difficultyLabel } from '@/lib/difficulty'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

/** Longest query the page will echo or match on. Guards the title and the rendered copy. */
const MAX_QUERY_LENGTH = 80

/** `?q=` as a single trimmed string, whatever the router hands over. */
const readQuery = (value?: string | string[]): string => {
  const raw = Array.isArray(value) ? value[0] : value
  return (raw ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY_LENGTH)
}

/**
 * Terms to match on. Single characters are dropped: they match almost everything and make an
 * empty query look like a hit.
 */
const searchTerms = (query: string): string[] =>
  Array.from(
    new Set(
      query
        .toLowerCase()
        .split(' ')
        .filter((term) => term.length > 1),
    ),
  )

/** Every term must appear somewhere in the document's own text. */
const matchesQuery = (terms: string[], fields: (string | null | undefined)[]): boolean => {
  if (terms.length === 0) return false
  const haystack = fields.filter(Boolean).join(' ').toLowerCase()
  return terms.every((term) => haystack.includes(term))
}

const destinationName = (trip: TripCardData): string | null =>
  trip.destination && typeof trip.destination !== 'number' ? trip.destination.name : null

/**
 * ============================================================================
 * SITE SEARCH — `/search`
 * ============================================================================
 *
 * The target of the sitewide `WebSite` SearchAction (`websiteJsonLd()` in `src/lib/seo.ts`), which
 * only counts as valid structured data if the URL it names actually performs the search. `/trips`
 * filters in the browser by design (see `TripsExplorer`), so the search gets its own route rather
 * than turning that static listing into a dynamic one.
 *
 * The query is read from the URL, so a result page is linkable and shareable, and the page itself
 * is `noindex`: a query string is not a page worth ranking, and the canonical work is already done
 * by the three listing pages it points into.
 *
 * Matching is deliberately simple and honest: all terms must appear in the document's title,
 * summary, tagline or region. No fuzzy scoring, no synonyms, nothing that would claim a match that
 * is not there.
 *
 * Reading `searchParams` opts this route into dynamic rendering. That is the price of a search
 * that works with JavaScript disabled and that a crawler can validate; `/trips` stays static.
 */
export async function generateMetadata(): Promise<Metadata> {
  const metadata = buildMetadata({
    title: dictionary.search.metaTitle,
    description: dictionary.search.metaDescription,
    path: sitePath('/search'),
    noIndex: true,
  })

  return {
    ...metadata,
    // `buildMetadata()` pairs noindex with nofollow. A results page should still pass link equity
    // to the trips and posts it lists, so `follow` is restored here.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const dict = dictionary
  const query = readQuery((await searchParams).q)

  const [trips, destinations, posts] = await Promise.all([
    query ? getTrips() : Promise.resolve([]),
    query ? getDestinations() : Promise.resolve([]),
    query ? getPosts() : Promise.resolve([]),
  ])

  const terms = searchTerms(query)

  const tripResults = trips.filter((trip) =>
    matchesQuery(terms, [
      trip.title,
      trip.summary,
      destinationName(trip),
      difficultyLabel(trip.difficulty),
    ]),
  )
  const destinationResults = destinations.filter((destination) =>
    matchesQuery(terms, [
      destination.name,
      destination.tagline,
      destination.country,
      destination.region,
    ]),
  )
  const postResults = posts.filter((post) => matchesQuery(terms, [post.title, post.excerpt]))

  const totalResults = tripResults.length + destinationResults.length + postResults.length

  return (
    <>
      <PageHeader
        eyebrow={dict.search.eyebrow}
        title={dict.search.heading}
        lead={dict.search.lead}
        breadcrumbs={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.search.title }]}
      />

      <section aria-label={dict.search.label} className="py-14 md:py-20">
        <div className="container-content">
          <form
            action={sitePath('/search')}
            method="get"
            role="search"
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <label htmlFor="search-q" className="sr-only">
              {dict.search.label}
            </label>
            <Input
              id="search-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder={dict.search.placeholder}
              autoComplete="off"
              className="sm:max-w-md"
            />
            <Button type="submit" size="lg" className="sm:w-auto">
              {dict.search.submit}
            </Button>
          </form>

          {query === '' ? (
            <div className="mt-12">
              <p className="lead max-w-2xl">{dict.search.noQuery}</p>
              <BrowseLinks />
            </div>
          ) : totalResults === 0 ? (
            <div className="mt-12">
              <h2 className="heading-lg">{dict.search.noResultsTitle}</h2>
              <p className="lead mt-4 max-w-2xl">{t(dict.search.noResultsText, { query })}</p>
              <BrowseLinks />
            </div>
          ) : (
            <div className="mt-12">
              <h2 className="heading-md">
                {t(dict.search.resultsFor, { query })}{' '}
                <span className="text-ink-60">{plural(dict.search, totalResults)}</span>
              </h2>

              {tripResults.length > 0 ? (
                <section aria-labelledby="search-trips" className="mt-12">
                  <h3 id="search-trips" className="heading-md mb-6">
                    {dict.search.trips}
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {tripResults.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                </section>
              ) : null}

              {destinationResults.length > 0 ? (
                <section aria-labelledby="search-destinations" className="mt-14">
                  <h3 id="search-destinations" className="heading-md mb-6">
                    {dict.search.destinations}
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {destinationResults.map((destination) => (
                      <DestinationCard key={destination.id} destination={destination} />
                    ))}
                  </div>
                </section>
              ) : null}

              {postResults.length > 0 ? (
                <section aria-labelledby="search-posts" className="mt-14">
                  <h3 id="search-posts" className="heading-md mb-6">
                    {dict.search.posts}
                  </h3>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {postResults.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.search.title, url: sitePath('/search') },
          ]),
          webPageJsonLd({
            name: dict.search.metaTitle,
            description: dict.search.metaDescription,
            url: sitePath('/search'),
          }),
        ]}
      />
    </>
  )
}

/** The three indexes the site is organised around, offered when a query returns nothing. */
function BrowseLinks() {
  const dict = dictionary

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Button asChild variant="outline" size="lg">
        <Link href={sitePath('/trips')}>{dict.search.browseTrips}</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href={sitePath('/destinations')}>{dict.search.browseDestinations}</Link>
      </Button>
      <Button asChild variant="outline" size="lg">
        <Link href={sitePath('/blog')}>{dict.search.browseJournal}</Link>
      </Button>
    </div>
  )
}
