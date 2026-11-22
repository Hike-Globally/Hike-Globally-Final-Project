import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Footprints } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { SitemapGuide, type SitemapLayer, type SitemapLayerKind, type SitemapRow } from '@/components/sections/sitemap-guide'
import { SitemapProfile, type ProfilePoint } from '@/components/sections/sitemap-profile'
import { Topography } from '@/components/sections/topography'
import { sitePath } from '@/i18n/config'
import { getChartSources, getSettings } from '@/lib/data'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './sitemap.css'

export const revalidate = 3600

const DESCRIPTION =
  'Every page on Hike Globally — the circuit, the nine landscapes, the landing pages and the summit register — paced out waypoint by waypoint, with the altitude at each stop.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return buildMetadata({
    title: 'Sitemap',
    description: DESCRIPTION,
    path: sitePath('/sitemap'),
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}

/* -------------------------------------------------------------------------- */
/* The route — the whole site paced out as one waymarked climb: every row      */
/* carries its altitude, the four layers are the camps along the ridge.        */
/* -------------------------------------------------------------------------- */

const pad = (value: number) => String(value).padStart(2, '0')
const formatElevation = (value: number) => value.toLocaleString('en-US')

/** Altitude (metres) assigned to the ten fixed circuit stops, bottom to top. */
const CIRCUIT_ELEVATIONS = [1420, 1665, 1890, 2125, 2245, 2315, 2410] as const

/** Altitude per landscape, in the fixed Browse Places order. */
const LANDSCAPE_ELEVATIONS: Record<string, number> = {
  lakes: 2620,
  waterfalls: 2740,
  'mountain-passes': 2955,
  canyons: 3080,
  'base-camps': 3325,
  caves: 3490,
  'bike-tours': 3620,
  'mountain-peaks': 3875,
  temples: 3995,
}

const LEDGER_BASE_ELEVATION = 4150
const LEDGER_STEP = 60
const REGISTER_FLOOR = 4480

/** The circuit: the front doors of the site, in the order a visitor would walk them. */
function circuitRows(chart: Awaited<ReturnType<typeof getChartSources>>): SitemapRow[] {
  const rows = [
    {
      title: 'Home',
      href: '/',
      path: '/',
      description: 'The front door — the trip carousel, the nine landscapes, the journal and the ask.',
    },
    {
      title: 'Trips',
      href: '/trips',
      path: '/trips',
      description: 'Every itinerary, from the Khumbu to Dolpo.',
      meta: chart.trips ? `${chart.trips} published` : undefined,
    },
    {
      title: 'Destinations',
      href: '/destinations',
      path: '/destinations',
      description: 'Guides to the mountain regions those trips cross.',
      meta: chart.destinations ? `${chart.destinations} regions` : undefined,
    },
    {
      title: 'Browse places',
      href: PLACE_INDEX_PATH,
      path: PLACE_INDEX_PATH,
      description: 'Nine landscapes, nine ways to choose a journey.',
      meta: '9 landscapes',
    },
    {
      title: 'Journal',
      href: '/blog',
      path: '/blog',
      description:
        'Field notes, packing lists and hard-won advice from guides who spend 200 days a year on the trail.',
      meta: chart.posts ? `${chart.posts} articles` : undefined,
    },
    {
      title: 'Plan your trip',
      href: '/contact',
      path: '/contact',
      description:
        'The enquiry desk — dates, budgets and custom routes, answered in a working day.',
    },
    {
      title: 'About',
      href: '/about',
      path: '/about',
      description: 'Who is behind the trips and how they are run.',
    },
  ]

  return rows.map((row, index) => ({ ...row, elevation: CIRCUIT_ELEVATIONS[index] }))
}

/** The landscapes: the nine Browse Places collections, in their fixed order. */
function landscapeRows(chart: Awaited<ReturnType<typeof getChartSources>>): SitemapRow[] {
  return placeCategories.map((category) => {
    const tagged = chart.placeCounts[category.value] ?? 0
    return {
      title: category.label,
      href: placeCategoryPath(category.value),
      path: placeCategoryPath(category.value),
      description: category.description,
      meta: tagged ? `${tagged} journey${tagged === 1 ? '' : 's'}` : undefined,
      elevation: LANDSCAPE_ELEVATIONS[category.value] ?? 3200,
      image: { src: category.image, alt: category.alt },
    }
  })
}

/** The ledger: CMS landing pages beyond the main circuit, straight from the CMS. */
function ledgerRows(chart: Awaited<ReturnType<typeof getChartSources>>): SitemapRow[] {
  return chart.pages.map((page, index) => ({
    title: page.title,
    href: sitePath(`/${page.slug}`),
    path: sitePath(`/${page.slug}`),
    description: page.summary ?? 'A landing page in the CMS.',
    elevation: LEDGER_BASE_ELEVATION + index * LEDGER_STEP,
  }))
}

/** The register: the machine-readable edges and the two fine-print pages. */
function recordRows(ledgerCount: number): SitemapRow[] {
  const base = Math.max(REGISTER_FLOOR, LEDGER_BASE_ELEVATION + ledgerCount * LEDGER_STEP + 30)
  return [
    {
      title: 'Sitemap',
      href: '/sitemap.xml',
      path: '/sitemap.xml',
      description: 'Every public URL on the site, with the last modification date and media.',
      meta: 'XML',
      elevation: base,
    },
    {
      title: 'Robots',
      href: '/robots.txt',
      path: '/robots.txt',
      description: 'The crawl rules — what engines may follow, and what stays off the chart.',
      meta: 'TXT',
      elevation: base + 95,
    },
    {
      title: 'RSS feed',
      href: '/feed.xml',
      path: '/feed.xml',
      description: 'Field notes in a drop — the journal, as it is published.',
      meta: 'RSS',
      elevation: base + 105,
    },
    {
      title: 'llms.txt',
      href: '/llms.txt',
      path: '/llms.txt',
      description: 'The site described to a language model — trips, regions, journal and pages.',
      meta: 'MD',
      elevation: base + 130,
    },
    {
      title: 'Privacy',
      href: '/privacy',
      path: '/privacy',
      description: 'What this site collects, and why.',
      meta: 'HTML',
      elevation: base + 410,
    },
    {
      title: 'Terms',
      href: '/terms',
      path: '/terms',
      description: 'The terms that apply to bookings and use of the site.',
      meta: 'HTML',
      elevation: base + 880,
    },
  ]
}

/** The camps, in walking order — the profile, the rail and the sections all read from this one shape. */
type Camp = {
  id: string
  kicker: string
  title: string
  note: string
  kind: SitemapLayerKind
  campLabel: string
  emptyNote?: string
  rows: SitemapRow[]
}

export default async function SitemapPage() {
  const [chart, settings] = await Promise.all([getChartSources(), getSettings()])

  const circuit = circuitRows(chart)
  const landscapes = landscapeRows(chart)
  const ledger = ledgerRows(chart)
  const records = recordRows(ledger.length)

  const camps: Camp[] = [
    {
      id: 'circuit',
      kicker: 'CAMP 01',
      title: 'The circuit',
      note: 'The front doors of the site, in the order a visitor would walk them — the trailhead every route starts from.',
      kind: 'trailheads',
      campLabel: 'THE CIRCUIT',
      rows: circuit,
    },
    {
      id: 'landscapes',
      kicker: 'CAMP 02',
      title: 'Nine benches',
      note: 'The nine Browse Places collections — the features every trip and article can carry, one contour bench at a time.',
      kind: 'benches',
      campLabel: 'THE LANDSCAPES',
      rows: landscapes,
    },
    {
      id: 'ledger',
      kicker: 'CAMP 03',
      title: 'The ledger',
      note: 'The landing pages the CMS keeps beyond the main circuit — surveyed straight from the CMS at build time.',
      kind: 'ledger',
      campLabel: 'THE LEDGER',
      emptyNote: 'This leaf of the ledger is still blank — it fills in as the CMS publishes landing pages.',
      rows: ledger,
    },
    {
      id: 'records',
      kicker: 'CAMP 04',
      title: 'The summit register',
      note: 'The machine-readable edges of the site and the two fine-print pages — sign your name on the way down.',
      kind: 'register',
      campLabel: 'THE REGISTER',
      rows: records,
    },
  ]

  const layers: SitemapLayer[] = camps.map(({ campLabel: _campLabel, ...layer }) => layer)

  /* The hero profile plots every waypoint in walking order, camp by camp. */
  const profilePoints: ProfilePoint[] = camps.flatMap((camp) =>
    camp.rows.map((row, index) => ({
      title: row.title,
      href: row.href,
      path: row.path,
      elevation: row.elevation,
      camp: index === 0 ? camp.campLabel : undefined,
    })),
  )

  const totalRows = layers.reduce((sum, layer) => sum + layer.rows.length, 0)
  const summit = profilePoints.length ? profilePoints[profilePoints.length - 1].elevation : 0
  const siteName = settings.siteName ?? 'Hike Globally'

  return (
    <div className="sitemap-page">
      <section className="sitemap-hero" data-header-hero aria-labelledby="sitemap-title">
        <Topography className="sitemap-hero__topography" />

        <div className="container-content sitemap-hero__inner">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sitemap' }]} />

          <p className="sitemap-hero__eyebrow">
            <span aria-hidden>Waymarked route — Sitemap</span>
            <span className="sitemap-hero__eyebrow-coord">27.9881° N · 86.9250° E</span>
          </p>

          <h1 id="sitemap-title" className="sitemap-hero__title">
            Every trail on the site,<br />
            <em>paced out.</em>
          </h1>

          <p className="sitemap-hero__lead">
            From the front door to the summit register — everything {siteName} publishes, paced out
            waypoint by waypoint, altitude and path included.
          </p>

          <dl className="sitemap-hero__stats">
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">{totalRows}</dt>
              <dd className="sitemap-hero__stat-label">waypoints</dd>
            </div>
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">9</dt>
              <dd className="sitemap-hero__stat-label">landscape benches</dd>
            </div>
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">{formatElevation(summit)}</dt>
              <dd className="sitemap-hero__stat-label">m to the register</dd>
            </div>
          </dl>
        </div>

        <div className="container-content sitemap-hero__profile-block">
          <div className="sitemap-hero__profile-caption">
            <p className="sitemap-hero__profile-title">
              <Footprints size={14} aria-hidden />
              The route at a glance
            </p>
            <p className="sitemap-hero__profile-note">
              Every waypoint is a live link · altitude in metres · profile not to scale
            </p>
          </div>
          <div className="sitemap-hero__profile-scroll">
            <SitemapProfile points={profilePoints} />
          </div>
        </div>

        <div className="container-content sitemap-hero__bottom">
          <span>{siteName.toUpperCase()} · NEPAL</span>
          <span aria-hidden>ROUTE / SITEMAP — CHART 01 · {pad(totalRows)} WAYPOINTS</span>
        </div>
      </section>

      <SitemapGuide layers={layers} />

      <section className="sitemap-cta" aria-labelledby="sitemap-cta-heading">
        <div className="container-content sitemap-cta__inner">
          <div className="sitemap-cta__copy">
            <p className="sitemap-cta__eyebrow">Off the route</p>
            <h2 id="sitemap-cta-heading" className="sitemap-cta__title">
              Need something <em>off the route?</em>
            </h2>
            <p className="sitemap-cta__text">
              The enquiry desk takes one working day. Tell us the route you are dreaming of — we
              will map it, or tell you how to get there yourself.
            </p>
          </div>
          <Link href="/contact" className="sitemap-cta__button">
            Enquire about a route
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Sitemap', url: sitePath('/sitemap') },
          ]),
          webPageJsonLd({
            type: 'CollectionPage',
            name: 'Sitemap',
            description: DESCRIPTION,
            url: sitePath('/sitemap'),
            siteName: settings.siteName,
            image: settings.defaultOgImage,
          }),
        ]}
      />
    </div>
  )
}
