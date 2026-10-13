import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { sitePath } from '@/i18n/config'
import { getAllPageSlugs, getPage, getSettings } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { breadcrumbJsonLd, buildMetadata, seoFromDoc, webPageJsonLd } from '@/lib/seo'

export const revalidate = 3600

/**
 * Route slugs owned by a dedicated route. Static segments already take precedence over this
 * catch-all, but the guard makes the intent explicit and protects against typos.
 */
const RESERVED = new Set([
  'trips',
  'destinations',
  'blog',
  'inquiry',
  'preview',
  'admin',
  'api',
  'home',
])

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
  if (RESERVED.has(slug)) return {}

  const includeDraft = await isLivePreviewRequest()
  const [page, settings] = await Promise.all([getPage(slug, includeDraft), getSettings()])
  if (!page) return {}

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
 */
export default async function FlexiblePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (RESERVED.has(slug)) notFound()

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
