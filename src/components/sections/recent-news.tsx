import Link from 'next/link'

import { PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { NewsCard } from '@/lib/data'
import { formatDate } from '@/lib/format'

/** A compact, server-rendered reading rail, separate from the related-news cards. */
export function RecentNews({ posts }: { posts: NewsCard[] }) {
  if (!posts.length) return null

  return (
    <section aria-labelledby="recent-news-title" className="border-t border-slate-20 pt-6">
      <h2 id="recent-news-title" className="font-heading text-xl font-semibold tracking-tight text-ink">
        {dictionary.news.recentNews}
      </h2>
      <ul className="mt-5 divide-y divide-slate-20">
        {posts.map((post) => {
          const date = post.publishedAt ?? post.createdAt
          return (
            <li key={post.id} className="py-4 first:pt-0 last:pb-0">
              <Link
                href={sitePath(`/news/${post.slug}`)}
                className="group flex items-start gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-deep"
              >
                <span className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-mist">
                  <PayloadImageFill
                    media={post.featuredImage}
                    alt=""
                    sizes="80px"
                    imageClassName="motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-medium text-ink group-hover:underline group-hover:underline-offset-4">
                    {post.title}
                  </span>
                  <time dateTime={date} className="mt-2 block text-xs text-slate-80">
                    {formatDate(date)}
                  </time>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
