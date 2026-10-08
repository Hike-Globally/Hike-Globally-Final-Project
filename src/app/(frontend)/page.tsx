import type { Metadata } from 'next'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { HomeFallback } from '@/components/views/home-fallback'
import { getPage, getSettings } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { buildMetadata, organizationJsonLd, seoFromDoc, siteUrl, websiteJsonLd } from '@/lib/seo'

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
  const seo = page
    ? seoFromDoc(page, { title: settings.siteName, description: settings.tagline })
    : null

  return buildMetadata({
    title:
      seo?.title ??
      `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
    description: seo?.description ?? settings.tagline ?? undefined,
    image: seo?.image ?? settings.defaultOgImage,
    path: '/',
    noIndex: seo?.noIndex ?? false,
    siteName: settings.siteName,
  })
}

export default async function HomePage() {
  const includeDraft = await isLivePreviewRequest()
  const [page, settings] = await Promise.all([getPage('home', includeDraft), getSettings()])

  return (
    <>
      {page ? <BlockRenderer blocks={page.blocks} /> : <HomeFallback />}

      <JsonLd
        data={[
          organizationJsonLd({
            name: settings.legalName || settings.siteName,
            url: siteUrl,
            logo:
              typeof settings.logo === 'object' && settings.logo?.url
                ? settings.logo.url
                : undefined,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            socials: settings.socials?.map((social) => ({
              platform: social.platform,
              url: social.url,
            })),
          }),
          websiteJsonLd({ name: settings.siteName, url: siteUrl }),
        ]}
      />
    </>
  )
}
