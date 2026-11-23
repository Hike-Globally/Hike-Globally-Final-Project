import type { Metadata } from 'next'

import { AuthorCard } from '@/components/cards/author-card'
import { JsonLd } from '@/components/seo/json-ld'
import { PageHeader } from '@/components/sections/page-header'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { isIndexableAuthor } from '@/lib/author-profile'
import { getAuthorIndex, getSettings } from '@/lib/data'
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo'

/**
 * ==============================================================================
 * AUTHORS INDEX — `/authors`
 * ==============================================================================
 *
 * The hub that links to every profile page. Without it an author page is only reachable from the
 * posts it wrote, so a guide with one old article is a dead end; with it, every account is one
 * click from the root and every profile is a first-class internal link.
 *
 * It is a `CollectionPage` whose `ItemList` is exactly the cards below, so the page hands a
 * crawler the author graph in one fetch.
 */
export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary.authors
  const settings = await getSettings()

  return buildMetadata({
    title: dict.indexTitle,
    description: dict.indexSubtitle,
    image: settings.defaultOgImage,
    path: sitePath('/authors'),
    siteName: settings.siteName,
  })
}

export default async function AuthorsPage() {
  const dict = dictionary.authors
  const authors = await getAuthorIndex()

  return (
    <>
      <PageHeader
        eyebrow={dict.indexEyebrow}
        title={dict.indexTitle}
        lead={dict.indexSubtitle}
        breadcrumbs={[
          { label: dictionary.nav.home, href: sitePath('/') },
          { label: dict.allAuthors },
        ]}
      />

      <section aria-labelledby="authors-index-heading" className="py-12 md:py-20">
        <div className="container-content">
          <h2 id="authors-index-heading" className="sr-only">
            {dict.allAuthors}
          </h2>

          {authors.length ? (
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {authors.map((author) => (
                <AuthorCard key={author.id} author={author} />
              ))}
            </div>
          ) : (
            <p className="description-copy leading-relaxed text-ink-60">{dict.indexEmpty}</p>
          )}
        </div>
      </section>

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dictionary.nav.home, url: sitePath('/') },
            { name: dict.allAuthors, url: sitePath('/authors') },
          ]),
          // The ItemList is the same cards above. Bare accounts are left out of the markup (not
          // the visible grid) so the structured data describes pages that are actually indexable.
          webPageJsonLd({
            type: 'CollectionPage',
            name: dict.indexTitle,
            description: dict.indexSubtitle,
            url: sitePath('/authors'),
            siteName: dictionary.structuredData.organization,
            items: authors
              .filter((author) =>
                isIndexableAuthor(author, {
                  posts: author.postCount,
                  trips: author.tripCount,
                }),
              )
              .map((author) => ({
                name: author.name,
                url: sitePath(`/authors/${author.slug}`),
              })),
          }),
        ]}
      />
    </>
  )
}
