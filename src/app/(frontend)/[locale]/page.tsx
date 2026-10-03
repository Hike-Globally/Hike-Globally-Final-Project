import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BlockRenderer } from '@/components/blocks/block-renderer'
import { JsonLd } from '@/components/seo/json-ld'
import { HomeFallback } from '@/components/views/home-fallback'
import { isLocale, type Locale } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import { getPage } from '@/lib/data'
import { buildMetadata, organizationJsonLd, seoFromDoc, websiteJsonLd } from '@/lib/seo'

/**
 * ============================================================================
 * HOMEPAGE — `/[locale]`
 * ============================================================================
 * Driven by the Payload page whose slug is `home`, so the entire homepage is
 * editable from the CMS (hero, featured trips, testimonials, FAQ, form…).
 * If no such page exists yet, a curated fallback composed of real CMS content
 * renders instead — the site never shows an empty shell.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const [page, settings] = await Promise.all([getPage(locale, 'home'), getSettings(locale)])
  const seo = page ? seoFromDoc(page, { title: settings.siteName, description: settings.tagline }) : null

  return buildMetadata({
    title: seo?.title ?? `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
    description: seo?.description ?? settings.tagline ?? undefined,
    image: seo?.image ?? settings.defaultOgImage,
    path: `/${locale}`,
    locale,
    noIndex: seo?.noIndex ?? false,
    siteName: settings.siteName,
  })
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const [page, settings] = await Promise.all([getPage(locale, 'home'), getSettings(locale)])

  return (
    <>
      {page ? (
        <BlockRenderer blocks={page.blocks} locale={locale} />
      ) : (
        <HomeFallback locale={locale} />
      )}

      <JsonLd
        data={[
          organizationJsonLd({
            name: settings.legalName || settings.siteName,
            url: siteUrlValue(),
            logo: typeof settings.logo === 'object' && settings.logo?.url ? settings.logo.url : undefined,
            email: settings.email,
            phone: settings.phone,
            address: settings.address,
            socials: settings.socials?.map((social) => ({ platform: social.platform, url: social.url })),
          }),
          websiteJsonLd({ name: settings.siteName, url: siteUrlValue() }),
        ]}
      />
    </>
  )
}

const siteUrlValue = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
