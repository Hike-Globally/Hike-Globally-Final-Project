import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown } from 'lucide-react'

import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import { BlogExplorer } from '@/components/views/blog-explorer'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getPosts, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

import './blog.css'

export const revalidate = 3600

/**
 * Full-bleed background for the journal hero.
 *
 * Bundled with the site, exactly like `/images/trips/hero.jpg` and
 * `/images/destinations/hero.jpg`: the hero is the masthead of the whole
 * listing, so it must look the same whether one post or fifty are published —
 * and it keeps every post's own cover available for its card below.
 */
const BLOG_HERO_IMAGE = '/images/blog/hero.jpg'

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
    /* `data-blog-page` scopes the journal type scale (see `blog.css`): the hero
       standfirst and every card excerpt take their pinned 16px from it, while
       the shared `PostCard` keeps its own type on every other surface. */
    <div data-blog-page="">
      {/* HERO — full-width banner in the same register as `/trips` and
          `/destinations`: image, scrim, breadcrumbs, eyebrow, display headline,
          standfirst and a jump link into the listing. Marked as the hero region
          so the global header stays pinned for as long as it is on screen
          (see header-frame.tsx). */}
      <section
        aria-labelledby="blog-heading"
        data-header-hero
        className="relative isolate flex min-h-[min(78svh,52rem)] items-end overflow-hidden bg-ink text-mist"
      >
        <Image
          src={BLOG_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden="true"
          className="-z-20 object-cover"
        />
        {/* One flat navy wash plus the shared photo scrim — the same recipe every
            other photographic header on the site uses. */}
        <div className="absolute inset-0 -z-10 bg-ink/72" aria-hidden="true" />
        <div className="photo-scrim absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-content relative w-full pt-32 pb-14 md:pb-20">
          <Breadcrumbs
            items={[{ label: dict.nav.home, href: sitePath('/') }, { label: dict.nav.blog }]}
          />

          <p className="eyebrow mt-10 text-mist">{dict.blog.heroEyebrow}</p>
          <h1 id="blog-heading" className="heading-display mt-5 max-w-4xl text-white">
            {dict.blog.listingTitle}
          </h1>
          <p className="lead blog-hero-lead mt-6 max-w-2xl text-mist">
            {dict.blog.listingSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="#journal"
              className="group inline-flex items-center gap-3 border-b border-mist/45 pb-2 text-sm font-medium text-white transition-colors hover:border-mist"
            >
              {dict.blog.browseJournal}
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-1"
                aria-hidden="true"
              />
            </Link>
            <span className="text-sm text-mist/85">{dict.blog.heroNote}</span>
          </div>
        </div>
      </section>

      <section
        id="journal"
        aria-label={dict.blog.listingTitle}
        className="scroll-mt-8 py-14 md:py-20"
      >
        <div className="container-content">
          {posts.length === 0 ? (
            <div className="border border-dashed border-slate-40 bg-mist p-8 text-center sm:p-12">
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
    </div>
  )
}
