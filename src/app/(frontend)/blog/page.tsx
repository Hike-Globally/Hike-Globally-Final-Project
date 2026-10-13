import type { Metadata } from 'next'

import { PageHeader } from '@/components/sections/page-header'
import { JsonLd } from '@/components/seo/json-ld'
import { BlogExplorer } from '@/components/views/blog-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPosts, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

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
    <>
      <PageHeader
        eyebrow={dict.nav.blog}
        title={dict.blog.listingTitle}
        lead={dict.blog.listingSubtitle}
        breadcrumbs={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.nav.blog }]}
      />

      <section className="py-14 md:py-20">
        <div className="container-content">
          {posts.length === 0 ? (
            <div className="border border-dashed border-black/10 bg-mist p-8 text-center sm:p-12">
              <h2 className="heading-md">{dict.common.noResultsTitle}</h2>
              <p className="lead mx-auto mt-3 max-w-lg">{dict.common.noResultsText}</p>
            </div>
          ) : (
            <BlogExplorer posts={posts} />
          )}
        </div>
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
    </>
  )
}
