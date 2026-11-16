import assert from 'node:assert/strict'
import test from 'node:test'

import type { DestinationCard, TripCard } from './data'
import {
  buildMegaMenuData,
  filterExtraCustomLinks,
  resolveMegaMenuKind,
} from './mega-menu'
import type { Media } from '../payload-types'

const media = (url: string, alt = 'Mountain view', extras: Partial<Media> = {}): Media =>
  ({
    id: 1,
    url,
    alt,
    focalX: 50,
    focalY: 40,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extras,
  }) as Media

const destinationsFixture: DestinationCard[] = [
  {
    id: 1,
    name: 'Mustang',
    slug: 'mustang',
    country: 'Nepal',
    tagline: 'Rain-shadow cliffs and walled kingdoms.',
    heroImage: media('/api/media/file/mustang.jpg', 'Mustang cliffs'),
    region: 'mustang',
    featured: false,
  },
  {
    id: 2,
    name: 'Khumbu',
    slug: 'khumbu',
    country: 'Nepal',
    tagline: 'Home of Everest and Sherpa valleys.',
    heroImage: media('https://hikeglobally.com/api/media/file/khumbu.jpg', 'Khumbu'),
    region: 'khumbu',
    featured: true,
  },
  {
    id: 3,
    name: 'Annapurna',
    slug: 'annapurna',
    country: 'Nepal',
    tagline: 'Lush foothills and high passes.',
    heroImage: media('/api/media/file/annapurna.jpg', 'Annapurna'),
    region: 'annapurna',
    featured: true,
  },
]

const tripsFixture: TripCard[] = [
  {
    id: 10,
    title: 'Everest Base Camp Trek',
    slug: 'everest-base-camp',
    summary: 'Classic Khumbu trail.',
    heroImage: media('/api/media/file/ebc.jpg', 'EBC'),
    tripType: 'trekking',
    durationDays: 14,
    maxAltitude: 5364,
    difficulty: 'challenging',
    bestSeasons: ['spring', 'autumn'],
    priceFrom: 1850,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 2, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 11,
    title: 'Gokyo Lakes Trek',
    slug: 'gokyo-lakes',
    summary: 'Turquoise glacial lakes.',
    heroImage: media('/api/media/file/gokyo.jpg', 'Gokyo'),
    tripType: 'trekking',
    durationDays: 12,
    maxAltitude: 5357,
    difficulty: 'challenging',
    bestSeasons: ['spring', 'autumn'],
    priceFrom: 1650,
    priceCurrency: 'USD',
    featured: false,
    destination: { id: 2, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 12,
    title: 'Annapurna Base Camp',
    slug: 'annapurna-base-camp',
    summary: 'Mountain sanctuary.',
    heroImage: media('/api/media/file/abc.jpg', 'ABC'),
    tripType: 'trekking',
    durationDays: 11,
    maxAltitude: 4130,
    difficulty: 'moderate',
    bestSeasons: ['spring', 'autumn', 'winter'],
    priceFrom: 1350,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 3, name: 'Annapurna', slug: 'annapurna' },
  },
  {
    id: 13,
    title: 'Island Peak Climb',
    slug: 'island-peak',
    summary: 'First Himalayan summit.',
    heroImage: media('/api/media/file/island-peak.jpg', 'Island Peak'),
    tripType: 'peak-climbing',
    durationDays: 16,
    maxAltitude: 6189,
    difficulty: 'strenuous',
    bestSeasons: ['spring', 'autumn'],
    priceFrom: 2650,
    priceCurrency: 'USD',
    featured: true,
    destination: { id: 2, name: 'Khumbu', slug: 'khumbu' },
  },
  {
    id: 14,
    title: 'Upper Mustang Overland',
    slug: 'upper-mustang',
    summary: 'Ancient trade route.',
    heroImage: media('/api/media/file/mustang-trip.mp4', 'Clip', { mimeType: 'video/mp4' }),
    tripType: 'cultural',
    durationDays: 10,
    maxAltitude: 3840,
    difficulty: 'easy-moderate',
    bestSeasons: ['summer', 'autumn'],
    priceFrom: 2100,
    priceCurrency: 'USD',
    featured: false,
    destination: { id: 1, name: 'Mustang', slug: 'mustang' },
  },
]

test('resolveMegaMenuKind activates only for Destinations and Trips top-level tabs', () => {
  assert.equal(resolveMegaMenuKind({ href: '/destinations', label: 'Destinations' }), 'destinations')
  assert.equal(resolveMegaMenuKind({ href: '/destinations/', label: 'Where we go' }), 'destinations')
  assert.equal(resolveMegaMenuKind({ href: '/trips', label: 'Trips' }), 'trips')
  assert.equal(resolveMegaMenuKind({ href: '/trips?sort=featured', label: 'All Treks' }), 'trips')
  assert.equal(resolveMegaMenuKind({ href: '#', label: 'Destinations' }), 'destinations')
  assert.equal(resolveMegaMenuKind({ href: '#', label: 'Trips' }), 'trips')

  assert.equal(resolveMegaMenuKind({ href: '/destinations/khumbu', label: 'Khumbu' }), null)
  assert.equal(resolveMegaMenuKind({ href: '/trips/everest-base-camp', label: 'EBC' }), null)
  assert.equal(resolveMegaMenuKind({ href: '/blog', label: 'Journal' }), null)
  assert.equal(resolveMegaMenuKind({ href: '/about', label: 'About' }), null)
  assert.equal(resolveMegaMenuKind({ href: '/', label: 'Home' }), null)
})

test('buildMegaMenuData sorts destinations featured-first with live trip counts and relative media URLs', () => {
  const data = buildMegaMenuData({
    destinations: destinationsFixture,
    trips: tripsFixture,
  })

  assert.deepEqual(
    data.destinations.items.map((item) => [item.slug, item.tripCount]),
    [
      ['khumbu', 3],
      ['annapurna', 1],
      ['mustang', 1],
    ],
  )
  // Absolute same-origin media URL is normalised to relative for preview domains
  assert.equal(data.destinations.items[0]?.image?.src, '/api/media/file/khumbu.jpg')
  assert.equal(data.destinations.items[0]?.image?.objectPosition, '50% 40%')
})

test('buildMegaMenuData picks featured trips, additional itineraries, and active region/style facets', () => {
  const data = buildMegaMenuData({
    destinations: destinationsFixture,
    trips: tripsFixture,
  })

  assert.equal(data.trips.isFeaturedHeading, true)
  assert.deepEqual(
    data.trips.featuredTrips.map((trip) => trip.slug),
    ['everest-base-camp', 'annapurna-base-camp', 'island-peak'],
  )
  assert.equal(data.trips.featuredTrips[0]?.priceFormatted, '$1,850')
  assert.deepEqual(
    data.trips.moreTrips.map((trip) => trip.href),
    ['/trips/gokyo-lakes', '/trips/upper-mustang'],
  )

  // By destination sorted by trip count desc
  assert.deepEqual(
    data.trips.byDestination.map((facet) => [facet.value, facet.count, facet.href]),
    [
      ['khumbu', 3, '/trips?destination=khumbu'],
      ['annapurna', 1, '/trips?destination=annapurna'],
      ['mustang', 1, '/trips?destination=mustang'],
    ],
  )

  // Multiple trip types present -> style facet is surfaced
  assert.deepEqual(
    data.trips.byType.map((facet) => facet.value),
    ['trekking', 'peak-climbing', 'cultural'],
  )

  // Difficulty, season, and total counts are excluded from mega-menu data
  assert.equal('byDifficulty' in data.trips, false)
  assert.equal('bySeason' in data.trips, false)
  assert.equal('totalCount' in data.trips, false)
  assert.equal('totalCount' in data.destinations, false)
})

test('buildMegaMenuData falls back to published trips when none are flagged featured and skips video thumbs', () => {
  const unflagged = tripsFixture.map((trip) => ({ ...trip, featured: false }))
  const data = buildMegaMenuData({
    destinations: destinationsFixture,
    trips: unflagged,
  })

  assert.equal(data.trips.isFeaturedHeading, false)
  assert.equal(data.trips.featuredTrips.length, 3)

  // Single trip type hides redundant style facet; video media returns null image
  const videoOnly = buildMegaMenuData({
    destinations: [],
    trips: [tripsFixture[4]!],
  })
  assert.equal(videoOnly.trips.featuredTrips[0]?.image, null)
  assert.deepEqual(videoOnly.trips.byType, [])
})

test('filterExtraCustomLinks removes root and duplicate links while keeping custom CMS entries', () => {
  const existing = new Set([
    '/destinations/khumbu',
    '/destinations/annapurna',
    '/trips?destination=khumbu',
    '/trips?destination=annapurna',
  ])

  const filteredDestinations = filterExtraCustomLinks(
    [
      { href: '/destinations', label: 'All destinations' },
      { href: '/destinations/khumbu', label: 'Khumbu' },
      { href: '/about', label: 'Our local team' },
    ],
    existing,
    '/destinations',
  )
  assert.deepEqual(filteredDestinations, [{ href: '/about', label: 'Our local team' }])

  const filteredTrips = filterExtraCustomLinks(
    [
      { href: '/trips', label: 'All trips' },
      { href: '/trips?region=khumbu-everest', label: 'Everest region' },
      { href: '/trips?region=annapurna', label: 'Annapurna region' },
      { href: '/contact', label: 'Custom private trek' },
    ],
    existing,
    '/trips',
  )
  assert.deepEqual(filteredTrips, [{ href: '/contact', label: 'Custom private trek' }])
})
