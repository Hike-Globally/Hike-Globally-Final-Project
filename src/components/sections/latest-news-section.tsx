import './latest-news-section.css'

import Link from 'next/link'

import { sitePath } from '@/i18n/config'
import { dictionary, newsCategoryLabelForDictionary } from '@/i18n/dictionaries'
import { getNews, type NewsCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { SectionHeading } from './section-heading'

/**
 * ============================================================================
 * LATEST NEWS — the homepage news index.
 * ============================================================================
 * Sits directly after the journal board (Latest Blogs and Stories) and before
 * "Plan your trip": the journal is the site's own long-form writing, this is
 * the wire copy — three quiet headline cards for what changed in the mountains
 * this week. Where the journal is a bespoke split board, the news index reads
 * as a compact newspaper row: one card per story, image over eyebrow over
 * headline, hairline borders, no numbered waypoints.
 *
 * The heading is the shared `SectionHeading` with `home-section-title`, so it
 * takes the same display face and size as every other homepage section
 * headline. Every card title is an `<h3>`, one level down from the section.
 *
 * Content is real CMS content (`getNews`, newest published first), so a fresh
 * database still renders the section from `defaultNews` instead of showing a
 * hole in the page.
 *
 * `dict.news.browseNews` ("Browse the news") is the section's foot — the
 * column-level link to `/news` the dictionary block describes — rather than a
 * top-right "view all" action, so the two listing sections above and below do
 * not repeat the same affordance twice.
 */

/** Cards the homepage news index shows — a newspaper row, not an archive. */
export const HOMEPAGE_NEWS_LIMIT = 3

/** `id` of the section heading — the section is labelled by it. */
const HEADING_ID = 'latest-news'

function NewsCardItem({ post }: { post: NewsCard }) {
  const dict = dictionary
  const href = sitePath(`/news/${post.slug}`)
  const label = post.categories?.[0]
    ? newsCategoryLabelForDictionary(post.categories[0], dict)
    : null
  const titleId = `latest-news-title-${post.id}`

  return (
    <a className="ln-card" data-linked="true" href={href} aria-labelledby={titleId}>
      <div className="ln-media">
        <PayloadImageFill
          media={post.featuredImage}
          sizes="(min-width: 1200px) 380px, (min-width: 810px) 30vw, 88vw"
          className="ln-image"
        />
      </div>

      <div className="ln-body">
        <p className="ln-eyebrow">
          {label ? <span className="ln-tag">{label}</span> : null}
          <span className="ln-date">
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
        </p>

        <h3 id={titleId} className="ln-title">
          {post.title}
        </h3>

        <p className="ln-excerpt">{post.excerpt}</p>

        <p className="ln-foot">
          <span className="ln-cta">
            <span>{dict.news.readStory}</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M5 12H19M13 6L19 12L13 18"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {post.content ? (
            <span className="ln-read-time">
              {dict.news.readTime.replace(
                '{minutes}',
                String(readingTimeMinutes(post.content)),
              )}
            </span>
          ) : null}
        </p>
      </div>
    </a>
  )
}

export async function LatestNewsSection() {
  const dict = dictionary
  const news = await getNews(HOMEPAGE_NEWS_LIMIT)

  if (news.length === 0) return null

  return (
    <section data-news-index="" className="relative py-16 md:py-24" aria-labelledby={HEADING_ID}>
      <div className="container-content">
        <SectionHeading
          titleId={HEADING_ID}
          title={dict.news.latest}
          description={dict.news.listingSubtitle}
          titleClassName="home-section-title"
          descriptionClassName="home-section-intro"
        />

        <div className="ln-grid">
          {news.map((post) => (
            <NewsCardItem key={post.id} post={post} />
          ))}
        </div>

        <p className="ln-foot-link">
          <Link href={sitePath('/news')}>{dict.news.browseNews}</Link>
        </p>
      </div>
    </section>
  )
}
