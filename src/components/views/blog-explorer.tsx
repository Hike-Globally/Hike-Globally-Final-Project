'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { archiveHref, filterQuery } from '@/lib/catalog'
import { blogCategoryOptions } from '@/lib/blog-categories'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { sitePath } from '@/i18n/config'
import { blogCategoryLabel, dictionary } from '@/i18n/dictionaries'
import type { PostCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'

// Archive-only card: the shared PostCard keeps its layout on other pages.
function ArchiveCard({
  post,
  featured,
  priority,
}: {
  post: PostCard
  featured?: boolean
  priority?: boolean
}) {
  const href = sitePath(`/blog/${post.slug}`)
  const [category, ...topics] = post.categories ?? []
  const date = post.publishedAt ?? post.createdAt
  const author = typeof post.author === 'object' ? post.author?.name : null
  const { blog } = dictionary

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
          {category && <span className="blog-archive-category">{blogCategoryLabel(category)}</span>}
          <time dateTime={date}>{formatDate(date)}</time>
        </div>
        <h2>
          <Link href={href}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <ul className="blog-archive-tags">
          {topics.map((topic) => (
            <li key={topic}>{blogCategoryLabel(topic)}</li>
          ))}
          {author && (
            <li>
              {blog.by} {author}
            </li>
          )}
          {post.content ? <li>
            {blog.readTime.replace('{minutes}', String(readingTimeMinutes(post.content)))}
          </li> : null}
        </ul>
      </div>
    </article>
  )
}

export function BlogExplorer({ posts, category }: { posts: PostCard[]; category: string }) {
  const router = useRouter()
  // Repeat the reference's feature + three-card row without changing post order.
  const groups = Array.from({ length: Math.ceil(posts.length / 4) }, (_, index) =>
    posts.slice(index * 4, index * 4 + 4),
  )

  return (
    <>
      <div className="blog-archive-filter">
        <select
          aria-label="Filter by topic"
          value={category}
          onChange={(event) =>
            router.push(archiveHref('blog', 1, filterQuery({ category: event.target.value })), {
              scroll: false,
            })
          }
        >
          <option value="all">{dictionary.blog.allCategories}</option>
          {blogCategoryOptions.map(({ value: topic }) => (
            <option key={topic} value={topic}>
              {blogCategoryLabel(topic)}
            </option>
          ))}
        </select>
      </div>
      <div className="blog-archive-rows" aria-live="polite">
        {!posts.length && <p>{dictionary.common.noResultsTitle}</p>}
        {groups.map(([lead, ...rest], index) => (
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
        ))}
      </div>
    </>
  )
}
