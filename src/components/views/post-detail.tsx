import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { RichText } from '@/components/content/rich-text'
import { PostCard } from '@/components/cards/post-card'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { PayloadImage } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { PostCard as PostCardData } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import type { Blog, Media } from '@/payload-types'

export function PostDetail({
  post,
  related,
  siteName,
}: {
  post: Blog
  related: PostCardData[]
  siteName: string
}) {
  const dict = dictionary

  const author = post.author && typeof post.author !== 'number' ? post.author : null
  const authorName = author?.name ?? null
  const publishedAt = post.publishedAt ?? post.createdAt
  const minutes = readingTimeMinutes(post.content)

  const category = post.categories?.[0]
  const categoryLabel = category
    ? (dict.blog[
        `category${category
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')}` as keyof typeof dict.blog
      ] ?? category)
    : null

  return (
    <>
      <article>
        <header className="relative isolate overflow-hidden bg-mist pt-12 pb-10 md:pt-16">
          <div className="container-content">
            <Breadcrumbs
              className="[&_a]:text-slate [&_span]:text-ink [&_svg]:text-ink/30 mb-8"
              items={[
                { label: dict.nav.home, href: sitePath('/') },
                { label: dict.nav.blog, href: sitePath('/blog') },
                { label: post.title },
              ]}
            />

            <div className="flex flex-wrap items-center gap-3 text-[0.75rem] tracking-[0.12em] text-slate uppercase">
              {categoryLabel ? <span className="text-deep">{categoryLabel}</span> : null}
              {categoryLabel ? <span aria-hidden>·</span> : null}
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
              <span aria-hidden>·</span>
              <span>{dict.blog.readTime.replace('{minutes}', String(minutes))}</span>
            </div>

            <h1 className="heading-xl mt-5 max-w-3xl">{post.title}</h1>
            <p className="lead mt-5 max-w-2xl">{post.excerpt}</p>
          </div>
        </header>

        <div className="container-content">
          <div className="overflow-hidden rounded-3xl bg-mist-60">
            <PayloadImage
              media={post.featuredImage as Media}
              size="hero"
              sizes="(min-width: 1280px) 1216px, 100vw"
              priority
              className="aspect-[16/9] w-full"
            />
          </div>
        </div>

        <div className="container-prose py-14 md:py-20">
          <RichText content={post.content} />

          {authorName ? (
            <div className="mt-14 flex items-center gap-4 rounded-2xl bg-mist p-6">
              {author?.avatar && typeof author.avatar !== 'number' ? (
                <PayloadImage
                  media={author.avatar}
                  size="thumbnail"
                  sizes="56px"
                  className="size-14 shrink-0 rounded-full"
                />
              ) : (
                <span className="grid size-14 shrink-0 place-items-center rounded-full bg-sage-40 font-heading text-lg font-semibold text-ink">
                  {authorName.slice(0, 1)}
                </span>
              )}
              <div>
                <p className="text-[0.75rem] tracking-[0.14em] text-slate uppercase">
                  {dict.blog.by}
                </p>
                <p className="font-heading text-lg font-semibold text-ink">{authorName}</p>
                {author?.bio ? (
                  <p className="mt-1 text-[0.9375rem] text-ink-60">{author.bio}</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-10">
            <Link
              href={sitePath('/blog')}
              className="inline-flex items-center gap-2 text-[0.9375rem] text-deep transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              {dict.blog.backToJournal}
            </Link>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-content">
            <h2 className="heading-lg mb-10">{dict.blog.related}</h2>
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <PostCard key={item.id} post={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: dict.nav.home, url: sitePath('/') },
            { name: dict.nav.blog, url: sitePath('/blog') },
            { name: post.title, url: sitePath(`/blog/${post.slug}`) },
          ]),
          blogPostingJsonLd({
            post,
            url: sitePath(`/blog/${post.slug}`),
            authorName,
            image:
              typeof post.featuredImage === 'object' && post.featuredImage?.url
                ? post.featuredImage.url
                : undefined,
            siteName,
          }),
        ]}
      />
    </>
  )
}
