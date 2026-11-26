import { notFound } from 'next/navigation'
import { ArchivePagination } from '@/components/sections/archive-pagination'
import {
  archiveHref,
  hasArchiveFilters,
  parsePage,
  type ArchiveProps,
  filterQuery,
  searchString,
} from '@/lib/catalog'
import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'
import { NewsExplorer } from '@/components/views/news-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { newsCategoryOptions } from '@/lib/news-categories'
import { getNewsPage, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

export const revalidate = 3600

export async function generateMetadata({ searchParams }: ArchiveProps): Promise<Metadata> {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const settings = await getSettings()

  return buildMetadata({
    title: page === 1 ? dict.news.listingTitle : `${dict.news.listingTitle} — Page ${page}`,
    description: dict.news.listingSubtitle,
    image: settings.defaultOgImage,
    path: archiveHref('news', page),
    siteName: settings.siteName,
    // A category filter is a narrower view of the same newsroom, not a page of its own: crawl it
    // for the articles it links to, but never index it.
    noIndex: hasArchiveFilters('news', searchString(search)),
    follow: true,
  })
}

/** NEWS LISTING — `/news` */
export default async function NewsPage({ searchParams }: ArchiveProps) {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const category = newsCategoryOptions.find((c) => c.value === search.category)?.value ?? 'all'
  const { docs: posts, totalPages } = await getNewsPage(page, category)
  if (page > 1 && page > totalPages) notFound()

  return (
    <div data-news-page="">
      <header className="blog-archive-intro">
        <p className="eyebrow text-slate-80">{dict.news.heroEyebrow}</p>
        <h1>{dict.news.listingTitle}</h1>
        <p>{dict.news.listingSubtitle}</p>
      </header>

      <section id="newsroom" aria-label={dict.news.listingTitle} className="blog-archive-feed">
        {posts.length === 0 && category === 'all' ? (
          <div className="border border-dashed border-slate-40 p-8 text-center sm:p-12">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
          </div>
        ) : (
          <NewsExplorer posts={posts} category={category} />
        )}
      </section>

      <ArchivePagination
        archive="news"
        page={page}
        totalPages={totalPages}
        filters={filterQuery({ category })}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.news, url: archiveHref('news', page) },
          ]),
          // A CollectionPage whose ItemList is exactly the articles above.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.news.listingTitle,
            description: dict.news.listingSubtitle,
            url: archiveHref('news', page),
            siteName: dict.structuredData.organization,
            items: posts.map((post) => ({
              name: post.title,
              url: sitePath(`/news/${post.slug}`),
            })),
          }),
        ]}
      />
    </div>
  )
}
