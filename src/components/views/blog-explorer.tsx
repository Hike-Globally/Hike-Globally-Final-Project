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
            'cursor-pointer rounded-[7px] border px-4 py-2 text-small font-medium transition-[background-color,border-color,color,box-shadow] duration-250 ease-[var(--ease-brand)]',
            category === 'all'
              ? 'border-btn-primary bg-btn-primary text-white shadow-2xs'
              : 'border-ink/18 bg-paper text-ink-80 hover:border-ink/45 hover:bg-mist hover:text-ink',
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
              'cursor-pointer rounded-[7px] border px-4 py-2 text-small font-medium transition-[background-color,border-color,color,box-shadow] duration-250 ease-[var(--ease-brand)]',
              category === value
                ? 'border-btn-primary bg-btn-primary text-white shadow-2xs'
                : 'border-ink/18 bg-paper text-ink-80 hover:border-ink/45 hover:bg-mist hover:text-ink',
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
