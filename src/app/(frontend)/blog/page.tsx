import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'
import { BlogExplorer } from '@/components/views/blog-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPosts, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './blog.css'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary
  const settings = await getSettings()

  return buildMetadata({
    title: dict.blog.listingTitle,
    description: dict.blog.listingSubtitle,
    image: settings.defaultOgImage,
    path: sitePath('/blog'),
    siteName: settings.siteName,
  })
}

/** BLOG LISTING — `/blog` */
export default async function BlogPage() {
  const dict = dictionary
  const posts = await getPosts()

  return (
    <div data-blog-page="">
      <header className="blog-archive-intro">
        <h1>{dict.blog.listingTitle}</h1>
        <p>{dict.blog.listingSubtitle}</p>
      </header>

      <section id="journal" aria-label={dict.blog.listingTitle} className="blog-archive-feed">
        {posts.length === 0 ? (
          <div className="border border-dashed border-slate-40 p-8 text-center sm:p-12">
            <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
            <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
          </div>
        ) : (
          <BlogExplorer posts={posts} />
        )}
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.blog, url: sitePath('/blog') },
          ]),
          // A CollectionPage whose ItemList is exactly the posts above.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.blog.listingTitle,
            description: dict.blog.listingSubtitle,
            url: sitePath('/blog'),
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
