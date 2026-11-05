'use client'

import { useMemo, useState } from 'react'

import { PostCard } from '@/components/cards/post-card'
import { blogCategoryLabel, dictionary } from '@/i18n/dictionaries'
import type { PostCard as PostCardData } from '@/lib/data'
import { cn } from '@/lib/utils'

/**
 * Category filter for the journal. Filtering is client-side so /blog stays a static page —
 * see the note in `trips-explorer.tsx` for the trade-off.
 */
export function BlogExplorer({ posts }: { posts: PostCardData[] }) {
  const dict = dictionary
  const [category, setCategory] = useState<string>('all')

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const post of posts) {
      for (const value of post.categories ?? []) set.add(value)
    }
    return Array.from(set)
  }, [posts])

  const filtered = useMemo(
    () =>
      category === 'all'
        ? posts
        : posts.filter((post) => post.categories?.includes(category as never)),
    [posts, category],
  )

  const label = blogCategoryLabel

  const [lead, ...rest] = filtered

  if (categories.length === 0) {
    return (
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
        {filtered.map((post, index) => (
          <PostCard key={post.id} post={post} priority={index < 3} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-12 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'border px-4 py-2 text-[0.8125rem] transition-colors',
            category === 'all'
              ? 'border-ink bg-ink text-white'
              : 'border-slate-20 text-ink-70 hover:border-slate-40 hover:text-ink',
          )}
        >
          {dict.blog.allCategories}
        </button>
        {categories.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              'border px-4 py-2 text-[0.8125rem] transition-colors',
              category === value
                ? 'border-ink bg-ink text-white'
                : 'border-slate-20 text-ink-70 hover:border-slate-40 hover:text-ink',
            )}
          >
            {label(value)}
          </button>
        ))}
      </div>

      {lead ? (
        <div className="mb-16">
          <PostCard post={lead} featured priority />
        </div>
      ) : null}

      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
        {rest.map((post, index) => (
          <PostCard key={post.id} post={post} priority={index < 2} />
        ))}
      </div>
    </div>
  )
}
