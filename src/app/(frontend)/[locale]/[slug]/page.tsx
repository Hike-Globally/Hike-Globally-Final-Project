import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getAllPageSlugs, getPage } from '@/lib/data'
import { isLivePreviewRequest } from '@/lib/live-preview-access'
import { breadcrumbJsonLd, buildMetadata, seoFromDoc } from '@/lib/seo'

export const revalidate = 3600

/**
 * Route slugs owned by a dedicated route. Static segments already take precedence over this
 * catch-all, but the guard makes the intent explicit and protects against typos.
 */
const RESERVED = new Set(['trips', 'destinations', 'blog', 'inquiry', 'preview', 'admin', 'api', 'home'])

export async function generateStaticParams() {
  const slugs = await getAllPageSlugs()
  return slugs.map(({ locale, slug }) => ({ locale, slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale) || RESERVED.has(slug)) return {}

  const includeDraft = await isLivePreviewRequest()
  const page = await getPage(locale, slug, includeDraft)
  if (!page) return {}

  const seo = seoFromDoc(page, { title: page.title })

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    image: seo.image,
    path: localizedPath(locale, `/${slug}`),
    locale,
    noIndex: seo.noIndex,
  })
}

/**
 * FLEXIBLE PAGE — `/[locale]/[slug]`
 *
 * Any page created in Payload's Pages collection automatically gets its own URL here
 * (e.g. /about-us, /our-guides, /responsible-travel), rendered from its blocks.
 */
export default async function FlexiblePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: localeParam, slug } = await params
  if (!isLocale(localeParam) || RESERVED.has(slug)) notFound()

  const locale = localeParam as Locale
  const includeDraft = await isLivePreviewRequest()
  const page = await getPage(locale, slug, includeDraft)

  if (!page) notFound()

  return (
    <>
      <BlockRenderer blocks={page.blocks} locale={locale} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', url: localizedPath(locale, '/') },
          { name: page.title, url: localizedPath(locale, `/${slug}`) },
        ])}
      />
    </>
  )
}
