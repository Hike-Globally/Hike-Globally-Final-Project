import type { Metadata } from 'next'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { HomeFallback } from '@/components/views/home-fallback'
import { getPage, getSettings } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, seoFromDoc, siteUrl, websiteJsonLd } from '@/lib/seo'

import './homepage.css'

export const revalidate = 3600

/**
 * Default search-engine title and description for the homepage.
 *
 * They are used whenever the CMS `home` page has no SEO override of its own. An editor can still
 * replace them from the admin (Pages → Home → "SEO & social sharing"), and that value wins.
 */
const HOMEPAGE_META_TITLE = 'Hike Globally | Family Tours, Trekking & Travel Guides'
const HOMEPAGE_META_DESCRIPTION =
  'Discover family tours, treks and global destinations with Hike Globally. Explore travel guides, expert tips and inspiring ideas for your next adventure.'

/**
 * ============================================================================
 * HOMEPAGE — `/`
 * ============================================================================
 * Driven by the Payload page whose slug is `home`, so the entire homepage is
 * editable from the CMS (hero, featured trips, testimonials, FAQ, form…).
 * If no such page exists yet, a curated fallback composed of real CMS content
 * renders instead — the site never shows an empty shell.
 */
export async function generateMetadata(): Promise<Metadata> {
  const includeDraft = await isLivePreviewRequest()
  const [page, settings] = await Promise.all([getPage('home', includeDraft), getSettings()])
  const seo = seoFromDoc(page ?? {}, {
    title: HOMEPAGE_META_TITLE,
    description: HOMEPAGE_META_DESCRIPTION,
  })

  const metadata = buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image ?? settings.defaultOgImage,
    path: '/',
    noIndex: seo.noIndex,
    siteName: settings.siteName,
  })

  return {
    ...metadata,
    // The homepage title is the full, final title. `absolute` stops the root layout's
    // "%s · Hike Globally" template from appending the brand a second time.
    title: { absolute: seo.title },
  }
}

export default async function HomePage() {
  const includeDraft = await isLivePreviewRequest()
  const [page, settings] = await Promise.all([getPage('home', includeDraft), getSettings()])

  return (
    /* `data-homepage` scopes the homepage type scale (see `homepage.css`): the
       hero headline, every section headline and every section intro take their
       size from it, while the same shared components keep their own type on
       every other page. */
    <div data-homepage="">
      {page ? <BlockRenderer blocks={page.blocks} homepage /> : <HomeFallback />}

      {/* The full Organization is emitted once by the shared root layout. */}
      <JsonLd data={websiteJsonLd({ name: settings.siteName, url: siteUrl })} />
    </div>
  )
}
