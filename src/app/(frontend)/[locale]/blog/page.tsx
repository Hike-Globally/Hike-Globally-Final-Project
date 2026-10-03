import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { BlogExplorer } from '@/components/views/blog-explorer'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { getPosts } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const dict = getDictionary(locale)

  return buildMetadata({
    title: dict.blog.listingTitle,
    description: dict.blog.listingSubtitle,
    path: localizedPath(locale, '/blog'),
    locale,
  })
}

/** BLOG LISTING — `/[locale]/blog` */
export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const dict = getDictionary(locale)
  const posts = await getPosts(locale)

  return (
    <>
      <PageHeader
        locale={locale}
        eyebrow={dict.nav.blog}
        title={dict.blog.listingTitle}
        lead={dict.blog.listingSubtitle}
        breadcrumbs={[{ label: dict.nav.home, href: localizedPath(locale, '/') }, { label: dict.nav.blog }]}
      />

      <section className="py-14 md:py-20">
        <div className="container-content">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-mist p-12 text-center">
              <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
              <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            </div>
          ) : (
            <BlogExplorer posts={posts} locale={locale} />
          )}
        </div>
      </section>

      <JsonLd
        data={breadcrumbJsonLd([
          { name: dict.nav.home, url: localizedPath(locale, '/') },
          { name: dict.nav.blog, url: localizedPath(locale, '/blog') },
        ])}
      />
    </>
  )
}
