import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { SitemapGuide, type SitemapLayer, type SitemapRow } from '@/components/sections/sitemap-guide'
import { Topography } from '@/components/sections/topography'
import { sitePath } from '@/i18n/config'
import { getChartSources, getSettings } from '@/lib/data'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './sitemap.css'

export const revalidate = 3600

const DESCRIPTION =
  'Every page on Hike Globally — the circuit, the nine landscapes, the CMS landing pages and the records — charted layer by layer with the path spelled out.'

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
/* The chart — one honest, hand-built index of the site                         */
/* -------------------------------------------------------------------------- */

/** The circuit: the front doors of the site, in the order a visitor would walk them. */
function circuitRows(chart: Awaited<ReturnType<typeof getChartSources>>): SitemapRow[] {
  return [
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
      description: 'Field notes, packing lists and hard-won advice from guides who spend 200 days a year on the trail.',
      meta: chart.posts ? `${chart.posts} articles` : undefined,
    },
    {
      title: 'Plan your trip',
      href: '/contact',
      path: '/contact',
      description: 'The enquiry desk — dates, budgets and custom routes, answered in a working day.',
    },
    {
      title: 'About',
      href: '/about',
      path: '/about',
      description: 'Who is behind the trips and how they are run.',
    },
  ]
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
    }
  })
}

/** The ledger: CMS landing pages beyond the main circuit, straight from the CMS. */
function ledgerRows(chart: Awaited<ReturnType<typeof getChartSources>>): SitemapRow[] {
  return chart.pages.map((page) => ({
    title: page.title,
    href: sitePath(`/${page.slug}`),
    path: sitePath(`/${page.slug}`),
    description: page.summary ?? 'A landing page in the CMS.',
  }))
}

/** The records: the machine-readable edges and the two fine-print pages. */
function recordRows(): SitemapRow[] {
  return [
    {
      title: 'Sitemap',
      href: '/sitemap.xml',
      path: '/sitemap.xml',
      description: 'Every public URL on the site, with the last modification date and media.',
      meta: 'XML',
    },
    {
      title: 'Robots',
      href: '/robots.txt',
      path: '/robots.txt',
      description: 'The crawl rules — what engines may follow, and what stays off the chart.',
      meta: 'TXT',
    },
    {
      title: 'RSS feed',
      href: '/feed.xml',
      path: '/feed.xml',
      description: 'Field notes in a drop — the journal, as it is published.',
      meta: 'RSS',
    },
    {
      title: 'llms.txt',
      href: '/llms.txt',
      path: '/llms.txt',
      description: 'The site described to a language model — trips, regions, journal and pages.',
      meta: 'MD',
    },
    {
      title: 'Privacy',
      href: '/privacy',
      path: '/privacy',
      description: 'What this site collects, and why.',
      meta: 'HTML',
    },
    {
      title: 'Terms',
      href: '/terms',
      path: '/terms',
      description: 'The terms that apply to bookings and use of the site.',
      meta: 'HTML',
    },
  ]
}

export default async function SitemapPage() {
  const [chart, settings] = await Promise.all([getChartSources(), getSettings()])

  const circuit = circuitRows(chart)
  const landscapes = landscapeRows(chart)
  const ledger = ledgerRows(chart)
  const records = recordRows()

  const layers: SitemapLayer[] = [
    {
      id: 'circuit',
      kicker: 'LAYER 01',
      title: 'The circuit',
      note: 'The front doors of the site, in the order a visitor would walk them.',
      rows: circuit,
    },
    {
      id: 'landscapes',
      kicker: 'LAYER 02',
      title: 'Landscapes',
      note: 'The nine Browse Places collections — the features every trip and article can carry.',
      rows: landscapes,
    },
    {
      id: 'ledger',
      kicker: 'LAYER 03',
      title: 'The ledger',
      note: 'The CMS landing pages beyond the main circuit.',
      emptyNote: 'Nothing here yet — this layer fills in as the CMS publishes landing pages.',
      rows: ledger,
    },
    {
      id: 'records',
      kicker: 'LAYER 04',
      title: 'The records',
      note: 'The machine-readable edges of the site, and the two fine-print pages.',
      rows: records,
    },
  ]

  const totalRows = layers.reduce((sum, layer) => sum + layer.rows.length, 0)
  const siteName = settings.siteName ?? 'Hike Globally'

  return (
    <div className="sitemap-page">
      <section className="sitemap-hero" data-header-hero aria-labelledby="sitemap-title">
        <Topography className="sitemap-hero__topography" />

        <div className="container-content sitemap-hero__inner">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sitemap' }]} />

          <p className="sitemap-hero__eyebrow">
            <span aria-hidden>NAVIGATION CHART</span>
            <span className="sitemap-hero__eyebrow-coord">27.9881° N · 86.9250° E</span>
          </p>

          <h1 id="sitemap-title" className="sitemap-hero__title">
            Every trail on the site,<br />
            <em>charted.</em>
          </h1>

          <p className="sitemap-hero__lead">
            A complete index of everything {siteName} publishes — the circuit, the nine landscapes,
            the landing pages and the records — with every path spelled out.
          </p>

          <dl className="sitemap-hero__stats">
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">{totalRows}</dt>
              <dd className="sitemap-hero__stat-label">ways in</dd>
            </div>
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">9</dt>
              <dd className="sitemap-hero__stat-label">landscapes</dd>
            </div>
            <div className="sitemap-hero__stat">
              <dt className="sitemap-hero__stat-value">{layers.length}</dt>
              <dd className="sitemap-hero__stat-label">layers</dd>
            </div>
          </dl>
        </div>

        <div className="container-content sitemap-hero__bottom">
          <span>{siteName.toUpperCase()} · NEPAL</span>
          <span aria-hidden>CHART / SITEMAP — 01</span>
        </div>
      </section>

      <SitemapGuide layers={layers} />

      <section className="sitemap-cta" aria-labelledby="sitemap-cta-heading">
        <div className="container-content sitemap-cta__inner">
          <div className="sitemap-cta__copy">
            <p className="sitemap-cta__eyebrow">Off the chart</p>
            <h2 id="sitemap-cta-heading" className="sitemap-cta__title">
              Need something <em>off the chart?</em>
            </h2>
            <p className="sitemap-cta__text">
              The enquiry desk takes one working day. Tell us the route you are dreaming of — we will
              map it, or tell you how to get there yourself.
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
