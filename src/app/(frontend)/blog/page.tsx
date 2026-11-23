import { blogCategoryOptions } from '@/lib/blog-categories'
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
import { BlogExplorer } from '@/components/views/blog-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPostsPage, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './blog.css'

export const revalidate = 3600

export async function generateMetadata({ searchParams }: ArchiveProps): Promise<Metadata> {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const settings = await getSettings()

  return buildMetadata({
    title: page === 1 ? dict.blog.listingTitle : `${dict.blog.listingTitle} — Page ${page}`,
    description: dict.blog.listingSubtitle,
    image: settings.defaultOgImage,
    path: archiveHref('blog', page),
    siteName: settings.siteName,
    // A topic filter is a narrower view of the same journal, not a page of its own: crawl it for
    // the posts it links to, but never index it.
    noIndex: hasArchiveFilters('blog', searchString(search)),
    follow: true,
  })
}

/** BLOG LISTING — `/blog` */
export default async function BlogPage({ searchParams }: ArchiveProps) {
  const dict = dictionary
  const search = await searchParams
  const page = parsePage(search.page) ?? notFound()
  const category = blogCategoryOptions.find((c) => c.value === search.category)?.value ?? 'all'
  const { docs: posts, totalPages } = await getPostsPage(page, category)
  if (page > 1 && page > totalPages) notFound()

  return (
    <div data-blog-page="">
      <header className="blog-archive-intro">
        <h1>{dict.blog.listingTitle}</h1>
        <p>{dict.blog.listingSubtitle}</p>
      </header>

      <section id="journal" aria-label={dict.blog.listingTitle} className="blog-archive-feed">
        {posts.length === 0 && category === 'all' ? (
          <div className="border border-dashed border-slate-40 p-8 text-center sm:p-12">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
          </div>
        ) : (
          <BlogExplorer posts={posts} category={category} />
        )}
      </section>

      <ArchivePagination
        archive="blog"
        page={page}
        totalPages={totalPages}
        filters={filterQuery({ category })}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.blog, url: archiveHref('blog', page) },
          ]),
          // A CollectionPage whose ItemList is exactly the posts above.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.blog.listingTitle,
            description: dict.blog.listingSubtitle,
            url: archiveHref('blog', page),
            siteName: dict.structuredData.organization,
            items: posts.map((post) => ({
              name: post.title,
              url: sitePath(`/blog/${post.slug}`),
            })),
          }),
        ]}
      />
    </div>
  )
}
