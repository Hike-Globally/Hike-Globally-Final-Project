import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { JsonLd } from '@/components/seo/json-ld'
import { AuthorDetail } from '@/components/views/author-detail'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { isIndexableAuthor } from '@/lib/author-profile'
import {
  getAllAuthorSlugs,
  getAuthorBySlug,
  getAuthorPosts,
  getAuthorTrips,
  getSettings,
} from '@/lib/data'
import { truncate } from '@/lib/format'
import { breadcrumbJsonLd, buildMetadata, profilePageJsonLd } from '@/lib/seo'

/**
 * ==============================================================================
 * AUTHOR PROFILE — `/authors/[slug]`
 * ==============================================================================
 *
 * One landing page per account, now and for any account created later.
 *
 * `generateStaticParams()` prerenders every existing profile at build time, and `dynamicParams`
 * stays on (the default), so an editor added after the last deploy gets a live `/authors/<slug>`
 * on their first request — cached from then on, exactly like a trip published after the build.
 *
 * A profile with no bio and no published work still renders (so a byline can always link to it)
 * but is `noindex`: a page with nothing to say is a thin URL, not an asset. The sitemap reaches
 * the same verdict through the same `isIndexableAuthor()` rule, so it can never advertise a page
 * that hides itself.
 */
export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllAuthorSlugs()
  return slugs.map((slug) => ({ slug }))
}

/** The published work an author page shows, and the same list that decides indexability. */
const readAuthorWork = async (authorId: number) => {
  const [posts, trips] = await Promise.all([
    getAuthorPosts(authorId),
    getAuthorTrips(authorId),
  ])
  return { posts, trips }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) return {}

  const settings = await getSettings()
  const { posts, trips } = await readAuthorWork(author.id)

  return buildMetadata({
    // A job title makes the SERP line say what the person is, not just who they are.
    title: author.jobTitle ? `${author.name} — ${author.jobTitle}` : author.name,
    description: truncate(author.bio ?? dictionary.authors.indexSubtitle, 160),
    image: author.avatar ?? settings.defaultOgImage,
    path: sitePath(`/authors/${slug}`),
    noIndex: !isIndexableAuthor(author, { posts: posts.length, trips: trips.length }),
    siteName: settings.siteName,
  })
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = await getAuthorBySlug(slug)
  if (!author) notFound()

  const { posts, trips } = await readAuthorWork(author.id)

  return (
    <>
      <AuthorDetail author={author} posts={posts} trips={trips} />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dictionary.nav.home, url: sitePath('/') },
            { name: dictionary.authors.allAuthors, url: sitePath('/authors') },
            { name: author.name, url: sitePath(`/authors/${slug}`) },
          ]),
          profilePageJsonLd({
            author,
            url: sitePath(`/authors/${slug}`),
            siteName: dictionary.structuredData.organization,
          }),
        ]}
      />
    </>
  )
}
