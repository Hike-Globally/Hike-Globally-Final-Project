import Link from 'next/link'

import { archiveHref, filterQuery } from '@/lib/catalog'
import { BlogArchiveFilter } from '@/components/views/blog-archive-filter'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { sitePath } from '@/i18n/config'
import { dictionary, newsCategoryLabel } from '@/i18n/dictionaries'
import type { NewsCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { newsCategoryOptions } from '@/lib/news-categories'

// Archive-only card: the shared NewsCard keeps its layout on other pages.
function ArchiveCard({
  post,
  featured,
  priority,
}: {
  post: NewsCard
  featured?: boolean
  priority?: boolean
}) {
  const href = sitePath(`/news/${post.slug}`)
  const [category, ...topics] = post.categories ?? []
  const date = post.publishedAt ?? post.createdAt
  const author = typeof post.author === 'object' ? post.author?.name : null
  const { news } = dictionary

  return (
    <article className={featured ? 'blog-archive-card blog-archive-feature' : 'blog-archive-card'}>
      <Link href={href} aria-label={post.title} tabIndex={-1} className="blog-archive-cover">
        <PayloadImageFill
          media={post.featuredImage}
          sizes={
            featured
              ? '(min-width: 900px) 46vw, 94vw'
              : '(min-width: 900px) 30vw, (min-width: 600px) 46vw, 94vw'
          }
          priority={priority}
        />
      </Link>
      <div className="blog-archive-copy">
        <div className="blog-archive-meta">
          {category && (
            <span className="blog-archive-category">{newsCategoryLabel(category)}</span>
          )}
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
        <h2>
          <Link href={href}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <ul className="blog-archive-tags">
          {topics.map((topic) => (
            <li key={topic}>{newsCategoryLabel(topic)}</li>
          ))}
          {author && (
            <li>
              {news.by} {author}
            </li>
          )}
          {post.content ? (
            <li>
              {news.readTime.replace('{minutes}', String(readingTimeMinutes(post.content)))}
            </li>
          ) : null}
        </ul>
      </div>
    </article>
  )
}

export function NewsExplorer({ posts, category }: { posts: NewsCard[]; category: string }) {
  // Keep the cards and their CMS content on the server. Only the category selector needs
  // client-side navigation, so a long archive doesn't hydrate every card and article body.
  // Repeat the reference's feature + three-card row without changing article order.
  const groups = Array.from({ length: Math.ceil(posts.length / 4) }, (_, index) =>
    posts.slice(index * 4, index * 4 + 4),
  )

  return (
    <>
      <BlogArchiveFilter
        category={category}
        allLabel={dictionary.news.allCategories}
        options={newsCategoryOptions.map(({ value }) => ({
          value,
          label: newsCategoryLabel(value),
          href: archiveHref('news', 1, filterQuery({ category: value })),
        }))}
        allHref={archiveHref('news', 1)}
      />
      <div className="blog-archive-rows" aria-live="polite">
        {!posts.length && <p>{dictionary.common.noResultsTitle}</p>}
        {groups.map(([lead, ...rest], index) =>
          lead ? (
            <div key={lead.id} className="blog-archive-group">
              <ArchiveCard post={lead} featured priority={index === 0} />
              {rest.length > 0 && (
                <div className="blog-archive-grid">
                  {rest.map((post) => (
                    <ArchiveCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          ) : null,
        )}
      </div>
    </>
  )
}
