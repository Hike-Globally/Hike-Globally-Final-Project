import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, FileCode2, FileText, Rss } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import {
  SitemapGuide,
  type SitemapNode,
  type SitemapSubsystem,
} from '@/components/sections/sitemap-guide'
import { Topography } from '@/components/sections/topography'
import { JsonLd } from '@/components/seo/json-ld'
import { sitePath } from '@/i18n/config'
import { getChartSources, getSettings, type ChartSources } from '@/lib/data'
import { PLACE_INDEX_PATH, placeCategories, placeCategoryPath } from '@/lib/place-categories'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './sitemap.css'

export const revalidate = 3600

const DESCRIPTION =
  'Full-funnel structural blueprint of Hike Globally. Interactive node architecture, wireframe topology, route specifications, and machine feeds for every production surface.'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return buildMetadata({
    title: 'Visual Sitemap & Information Flow',
    description: DESCRIPTION,
    path: sitePath('/sitemap'),
    image: settings.defaultOgImage,
    siteName: settings.siteName,
  })
}

function buildSubsystems(chart: ChartSources, siteName: string): {
  rootNode: SitemapNode
  subsystems: SitemapSubsystem[]
} {
  const rootNode: SitemapNode = {
    title: `${siteName} Home`,
    href: sitePath('/'),
    path: '/',
    description: 'Primary platform root — featured expeditions, nine landscapes, regional guides, and field notes.',
    status: '200',
    kind: 'root',
  }

  /* 01 — Core & Brand */
  const coreNodes: SitemapNode[] = [
    rootNode,
    {
      title: 'Contact & Trip Enquiry',
      href: sitePath('/contact'),
      path: '/contact',
      description: 'Direct expedition desk for custom dates, route planning, and group enquiries.',
      status: '200',
      kind: 'hub',
    },
    {
      title: 'About — Expedition Credo',
      href: sitePath('/about'),
      path: '/about',
      description: 'Who stands behind Hike Globally and how Himalayan and global treks are curated.',
      status: '200',
      kind: 'endpoint',
    },
    ...chart.pages.map(
      (page): SitemapNode => ({
        title: page.title,
        href: sitePath(`/${page.slug}`),
        path: sitePath(`/${page.slug}`),
        description: page.summary ?? 'Published CMS landing surface.',
        status: '200',
        kind: 'endpoint',
        meta: page.meta ?? undefined,
      }),
    ),
  ]

  /* 02 — Trips & Expeditions */
  const tripNodes: SitemapNode[] = [
    {
      title: 'Trips & Expeditions Hub',
      href: sitePath('/trips'),
      path: '/trips',
      description: 'Complete expedition catalog with multi-axis filters for difficulty, region, and duration.',
      status: '200',
      kind: 'hub',
      meta: chart.trips ? `${chart.trips} published` : undefined,
    },
    ...chart.tripNodes.map(
      (trip): SitemapNode => ({
        title: trip.title,
        href: sitePath(`/trips/${trip.slug}`),
        path: sitePath(`/trips/${trip.slug}`),
        description: trip.summary ?? 'Full itinerary, altitude profile, departures, and packing list.',
        status: '200',
        kind: 'endpoint',
        meta: trip.meta ?? undefined,
      }),
    ),
  ]

  /* 03 — Browse Places (Landscapes) */
  const indexedPlaceCategories = placeCategories.filter(
    (category) => (chart.placeCounts[category.value] ?? 0) > 0,
  )
  const placeNodes: SitemapNode[] = [
    {
      title: 'Browse Places Parent Hub',
      href: PLACE_INDEX_PATH,
      path: PLACE_INDEX_PATH,
      description: 'Cross-cutting terrain taxonomy indexing nine distinct natural and cultural features.',
      status: '200',
      kind: 'hub',
      meta: `${indexedPlaceCategories.length} landscapes`,
    },
    ...indexedPlaceCategories.map((category): SitemapNode => {
      const count = chart.placeCounts[category.value] ?? 0
      return {
        title: category.label,
        href: placeCategoryPath(category.value),
        path: placeCategoryPath(category.value),
        description: category.description,
        status: '200',
        kind: 'endpoint',
        meta: `${count} tagged`,
      }
    }),
  ]

  /* 04 — Destinations & Regions */
  const destinationNodes: SitemapNode[] = [
    {
      title: 'Destinations Parent Hub',
      href: sitePath('/destinations'),
      path: '/destinations',
      description: 'Regional geography guides covering Himalayan valleys and international trekking zones.',
      status: '200',
      kind: 'hub',
      meta: chart.destinations ? `${chart.destinations} regions` : undefined,
    },
    ...chart.destinationNodes.map(
      (dest): SitemapNode => ({
        title: dest.title,
        href: sitePath(`/destinations/${dest.slug}`),
        path: sitePath(`/destinations/${dest.slug}`),
        description: dest.summary ?? 'Regional overview, climate windows, and linked itineraries.',
        status: '200',
        kind: 'endpoint',
        meta: dest.meta ?? undefined,
      }),
    ),
  ]

  /* 05 — Journal & Field Guides */
  const journalNodes: SitemapNode[] = [
    {
      title: 'Journal — Field Notes Hub',
      href: sitePath('/blog'),
      path: '/blog',
      description: 'Technical trekking guides, altitude protocols, packing checklists, and trail dispatches.',
      status: '200',
      kind: 'hub',
      meta: chart.posts ? `${chart.posts} articles` : undefined,
    },
    {
      title: 'Authors & Mountain Guides Hub',
      href: sitePath('/authors'),
      path: '/authors',
      description: 'Verified profile directory of expedition writers, trail specialists, and mountain guides.',
      status: '200',
      kind: 'hub',
      meta: chart.authorNodes.length ? `${chart.authorNodes.length} profiles` : undefined,
    },
    ...chart.postNodes.map(
      (post): SitemapNode => ({
        title: post.title,
        href: sitePath(`/blog/${post.slug}`),
        path: sitePath(`/blog/${post.slug}`),
        description: post.summary ?? 'Editorial field report and trail guidance.',
        status: '200',
        kind: 'endpoint',
        meta: post.meta ?? undefined,
      }),
    ),
    ...chart.authorNodes.map(
      (author): SitemapNode => ({
        title: author.title,
        href: sitePath(`/authors/${author.slug}`),
        path: sitePath(`/authors/${author.slug}`),
        description: author.summary ?? 'Author credentials and published trail dispatches.',
        status: '200',
        kind: 'endpoint',
        meta: author.meta ?? undefined,
      }),
    ),
  ]

  /* 06 — Governance & Protocols */
  const governanceNodes: SitemapNode[] = [
    {
      title: 'Privacy Policy',
      href: sitePath('/privacy'),
      path: '/privacy',
      description: 'Data stewardship, enquiry handling, analytics disclosures, and traveller privacy rights.',
      status: '200',
      kind: 'endpoint',
      meta: 'HTML',
    },
    {
      title: 'Terms & Conditions',
      href: sitePath('/terms'),
      path: '/terms',
      description: 'Platform terms of use, affiliate booking disclosures, and expedition guidance.',
      status: '200',
      kind: 'endpoint',
      meta: 'HTML',
    },
    {
      title: 'Visual Sitemap & Information Flow',
      href: sitePath('/sitemap'),
      path: '/sitemap',
      description: 'Interactive structural blueprint, wireframe topology, and route index.',
      status: '200',
      kind: 'hub',
      meta: 'IA MAP',
    },
  ]

  const subsystems: SitemapSubsystem[] = [
    {
      id: 'core',
      code: '01',
      kicker: 'Root & Direction',
      title: 'Core & Brand',
      description:
        'The flagship entry points: the primary platform root, expedition credo, direct enquiry routing, and CMS landing surfaces.',
      accent: 'ink',
      nodes: coreNodes,
    },
    {
      id: 'trips',
      code: '02',
      kicker: 'Expedition Catalog',
      title: 'Trips & Expeditions',
      description:
        'Structured multi-day trekking itineraries wired with altitude profiles, departure calendars, and route specifications.',
      accent: 'sage',
      nodes: tripNodes,
    },
    {
      id: 'places',
      code: '03',
      kicker: 'Terrain Specializations',
      title: 'Browse Places',
      description:
        'Nine cross-cutting geographical archetypes—from glacial lakes to high passes—connecting trips and field dispatches.',
      accent: 'deep',
      nodes: placeNodes,
    },
    {
      id: 'destinations',
      code: '04',
      kicker: 'Mountain Locales',
      title: 'Regional Operations',
      description:
        'Himalayan valleys and international mountain corridors with dedicated regional overviews and linked routes.',
      accent: 'haze',
      nodes: destinationNodes,
    },
    {
      id: 'journal',
      code: '05',
      kicker: 'Publications & Guides',
      title: 'Journal & Authors',
      description:
        'Field notes, acclimatization checklists, gear essays, and verified guide profiles filed from the trail.',
      accent: 'slate',
      nodes: journalNodes,
    },
    {
      id: 'governance',
      code: '06',
      kicker: 'Legal Frameworks',
      title: 'Governance & Trust',
      description:
        'Transparent traveller privacy standards, platform terms of engagement, and this interactive architecture map.',
      accent: 'ink',
      nodes: governanceNodes,
    },
  ]

  return { rootNode, subsystems }
}

export default async function SitemapPage() {
  const [chart, settings] = await Promise.all([getChartSources(), getSettings()])
  const siteName = settings.siteName ?? 'Hike Globally'
  const { rootNode, subsystems } = buildSubsystems(chart, siteName)

  const allNodes = subsystems.flatMap((sub) => sub.nodes)
  const indexedNodesCount = allNodes.length
  const hubRootsCount = allNodes.filter((node) => node.kind === 'root' || node.kind === 'hub').length
  const endpointCount = allNodes.length - hubRootsCount
  const syncDate = chart.lastSyncedAt ? chart.lastSyncedAt.slice(0, 10) : 'live'

  return (
    <div className="sitemap-page">
      {/* ====================================================================
          HERO — ARCHITECTURAL BLUEPRINT HEADER
          ==================================================================== */}
      <section className="ia-hero" data-header-hero aria-labelledby="sitemap-title">
        <Topography className="ia-hero__topography" />

        <div className="container-content ia-hero__inner">
          <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Sitemap' }]} />

          <div className="ia-hero__badges">
            <span className="ia-badge ia-badge--code">
              HG-MAP-01 · Visual IA Map <span aria-hidden="true">{'//'}</span> Blueprint Grade
            </span>
            <span className="ia-badge ia-badge--sync">
              <span className="ia-badge__dot" aria-hidden="true" />
              Live Architecture Sync <span aria-hidden="true">{'//'}</span> auto-synced {syncDate}
            </span>
          </div>

          <h1 id="sitemap-title" className="ia-hero__title">
            Visual Sitemap &amp; <em>Information Flow</em>
          </h1>

          <p className="ia-hero__lead">
            Full-funnel structural blueprint of {siteName}. Interactive node architecture, wireframe
            topology, route specifications, and machine feeds for every production surface.
          </p>

          <dl className="ia-hero__metrics">
            <div className="ia-metric">
              <dt className="ia-metric__label">Indexed Nodes</dt>
              <dd className="ia-metric__value">{indexedNodesCount}</dd>
            </div>
            <div className="ia-metric">
              <dt className="ia-metric__label">Hub Roots</dt>
              <dd className="ia-metric__value">{hubRootsCount}</dd>
            </div>
            <div className="ia-metric">
              <dt className="ia-metric__label">Route Endpoints</dt>
              <dd className="ia-metric__value">{endpointCount}</dd>
            </div>
            <div className="ia-metric">
              <dt className="ia-metric__label">Core Subsystems</dt>
              <dd className="ia-metric__value">{subsystems.length}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ====================================================================
          INTERACTIVE EXPLORER + 01 ARCHITECTURAL TAXONOMY
          ==================================================================== */}
      <SitemapGuide subsystems={subsystems} rootNode={rootNode} />

      {/* ====================================================================
          CRAWLER & ENGINE DISTRIBUTION — PROTOCOL FEEDS
          ==================================================================== */}
      <section className="ia-protocol" aria-labelledby="ia-protocol-heading">
        <div className="container-content ia-protocol__inner">
          <div className="ia-protocol__copy">
            <p className="ia-protocol__eyebrow">Crawler &amp; Engine Distribution</p>
            <h2 id="ia-protocol-heading" className="ia-protocol__title">
              Engine Protocol &amp; Sitemap XML Feed
            </h2>
            <p className="ia-protocol__desc">
              Automated search engines and LLM crawlers query the production-ready machine feeds.
              Contains strictly indexable canonical targets with verified modification timestamps
              and structured media. Excluded drafts and filtered archives stay dark.
            </p>
          </div>

          <div className="ia-protocol__actions">
            <a href="/sitemap.xml" className="ia-protocol__btn ia-protocol__btn--primary">
              <FileCode2 size={16} aria-hidden />
              <span>Raw sitemap.xml</span>
              <ArrowUpRight size={15} aria-hidden />
            </a>
            <a href="/feed.xml" className="ia-protocol__btn ia-protocol__btn--secondary">
              <Rss size={16} aria-hidden />
              <span>RSS Telemetry Feed</span>
              <ArrowUpRight size={15} aria-hidden />
            </a>
            <a href="/llms.txt" className="ia-protocol__btn ia-protocol__btn--secondary">
              <FileText size={16} aria-hidden />
              <span>LLM Index (llms.txt)</span>
              <ArrowUpRight size={15} aria-hidden />
            </a>
            <Link href="/contact" className="ia-protocol__cta-link">
              <span>Need a custom route? Contact the expedition desk</span>
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
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
            name: 'Visual Sitemap & Information Flow',
            description: DESCRIPTION,
            url: sitePath('/sitemap'),
            siteName: settings.siteName,
            image: settings.defaultOgImage,
            items: allNodes.map((node) => ({
              name: node.title,
              url: node.href,
            })),
          }),
        ]}
      />
    </div>
  )
}
