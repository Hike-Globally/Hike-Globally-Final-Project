import Link from 'next/link'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/i18n/config'
import type { PostCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'

export function PostCard({
  post,
  locale,
  priority = false,
  featured = false,
  className,
}: {
  post: PostCard
  locale: Locale
  priority?: boolean
  featured?: boolean
  className?: string
}) {
  const dict = getDictionary(locale)
  const href = localizedPath(locale, `/blog/${post.slug}`)
  const authorName =
    post.author && typeof post.author !== 'number' ? post.author.name : null
  const category = post.categories?.[0]
  const categoryLabel = category
    ? dict.blog[
        `category${category
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')}` as keyof typeof dict.blog
      ] ?? category
    : null

  return (
    <article
      className={cn(
        'group flex h-full flex-col',
        featured ? 'lg:flex-row lg:items-center lg:gap-10' : '',
        className,
      )}
    >
      <Link
        href={href}
        className={cn(
          'relative block overflow-hidden rounded-2xl bg-mist-60',
          featured ? 'lg:w-[58%]' : '',
          featured ? 'aspect-[16/10]' : 'aspect-[16/11]',
        )}
      >
        <PayloadImageFill
          media={post.featuredImage}
          size={featured ? 'tablet' : 'card'}
          sizes={
            featured
              ? '(min-width: 1024px) 55vw, 92vw'
              : '(min-width: 1280px) 33vw, (min-width: 768px) 45vw, 92vw'
          }
          priority={priority}
          imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />
      </Link>

      <div className={cn('flex flex-1 flex-col', featured ? 'pt-6 lg:w-[42%] lg:pt-0' : 'pt-5')}>
        <div className="flex items-center gap-3 text-[0.75rem] tracking-[0.12em] text-slate uppercase">
          {categoryLabel ? <span className="text-deep">{categoryLabel}</span> : null}
          {categoryLabel ? <span aria-hidden>·</span> : null}
          <time dateTime={(post.publishedAt ?? post.createdAt) as string}>
            {formatDate(post.publishedAt ?? post.createdAt, locale)}
          </time>
        </div>

        <h3
          className={cn(
            'mt-3 font-heading font-semibold text-ink',
            featured ? 'text-3xl md:text-4xl' : 'text-xl',
          )}
        >
          <Link href={href} className="transition-colors hover:text-deep">
            {post.title}
          </Link>
        </h3>

        <p
          className={cn(
            'mt-3 leading-relaxed text-ink-60',
            featured ? 'text-[1.0625rem]' : 'line-clamp-3 text-[0.9375rem]',
          )}
        >
          {post.excerpt}
        </p>

        <p className="mt-4 text-[0.8125rem] text-slate">
          {authorName ? `${dict.blog.by} ${authorName}` : null}
          {authorName ? <span aria-hidden> · </span> : null}
          {dict.blog.readTime.replace('{minutes}', String(readingTimeMinutes(post.excerpt ?? '')))}
        </p>
      </div>
    </article>
  )
}
