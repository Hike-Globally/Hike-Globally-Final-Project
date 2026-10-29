import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { sitePath } from '@/i18n/config'
import { getAllPageSlugs, getPage, getSettings } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { breadcrumbJsonLd, buildMetadata, seoFromDoc, webPageJsonLd } from '@/lib/seo'
import { isReservedPageSlug } from '@/lib/site-routes'

export const revalidate = 3600

/**
 * Every published page is prerendered at build time; `getAllPageSlugs()` already leaves out the
 * homepage and the slugs a dedicated route owns (`src/lib/site-routes.ts`, shared with the
 * sitemap), because none of those has a URL under this catch-all.
 */
export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (isReservedPageSlug(slug)) return {}

  const includeDraft = await isLivePreviewRequest()
  const page = await getPage(slug, includeDraft)
  if (!page) return {}

  const settings = await getSettings()

  const seo = seoFromDoc(page, { title: page.title })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    // The page's own social image, else the site default from the settings global.
    image: seo.image ?? settings.defaultOgImage,
    path: sitePath(`/${slug}`),
    noIndex: seo.noIndex,
    siteName: settings.siteName,
  })
}

/**
 * FLEXIBLE PAGE — `/[slug]`
 *
 * Any page created in Payload's Pages collection automatically gets its own URL here
 * (e.g. /about-us, /our-guides, /responsible-travel), rendered from its blocks.
 *
 * A slug a dedicated route owns (`home`, `trips`, `blog`, …) is not a URL of its own: static
 * segments already take precedence over this catch-all, and the guard below makes that explicit
 * (and keeps the sitemap, which uses the same list, honest).
 */
export default async function FlexiblePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (isReservedPageSlug(slug)) notFound()

  const includeDraft = await isLivePreviewRequest()
  const page = await getPage(slug, includeDraft)

  if (!page) notFound()

  const seo = seoFromDoc(page, { title: page.title })

  return (
    <>
      <BlockRenderer blocks={page.blocks} singlePage />
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Home', url: sitePath('/') },
            { name: page.title, url: sitePath(`/${slug}`) },
          ]),
          // Every CMS page describes itself to Google as a WebPage tied to the site node.
          webPageJsonLd({
            name: page.title,
            description: seo.description,
            url: sitePath(`/${slug}`),
            image: seo.image,
          }),
        ]}
      />
    </>
  )
}
