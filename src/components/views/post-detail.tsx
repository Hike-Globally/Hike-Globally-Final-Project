import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, Compass } from 'lucide-react'

import { ArticleReadingProgress } from '@/components/blog/article-reading-progress'
import { ArticleShareButton } from '@/components/blog/article-share-button'
import { RichText } from '@/components/content/rich-text'
import { PostCard } from '@/components/cards/post-card'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { Button } from '@/components/ui/button'
import { PayloadImage, PayloadImageFill } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { PostCard as PostCardData } from '@/lib/data'
import { getArticleHeadings } from '@/lib/article-headings'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { blogPostingJsonLd, breadcrumbJsonLd } from '@/lib/seo'
import { cn } from '@/lib/utils'
import type { Blog } from '@/payload-types'

function TopographicLines() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[78%] text-sage/[0.16]"
      fill="none"
      focusable="false"
      viewBox="0 0 1000 760"
      preserveAspectRatio="xMidYMid slice"
    >
      <g stroke="currentColor" strokeWidth="1">
        <path d="M391 802c-15-104 50-157 139-215 99-65 117-133 71-207-42-68-21-127 66-178 62-36 79-88 50-156" />
        <path d="M424 812c-10-87 48-137 127-190 91-61 110-123 69-188-38-60-22-113 56-158 57-33 70-77 45-130" />
        <path d="M457 822c-5-70 45-117 114-165 82-57 100-111 67-169-32-53-21-99 46-138 50-29 61-66 39-105" />
        <path d="M490 832c1-55 42-97 101-140 73-52 90-100 64-150-27-46-20-84 36-118 44-26 52-55 34-80" />
        <path d="M523 842c7-39 39-77 88-115 64-48 80-89 61-131-21-39-18-69 26-98 37-24 43-44 29-55" />
        <path d="M556 852c13-23 36-57 75-90 56-43 70-78 58-112-15-32-15-55 16-78 31-23 34-33 24-30" />
        <path d="M169 655c69-85 159-88 233-36 54 38 119 31 175-25 66-66 133-65 198 4 57 60 118 69 183 25" />
        <path d="M143 623c76-96 176-98 259-39 61 43 134 35 197-28 73-74 147-73 219 5 63 66 132 76 205 28" />
        <path d="M119 591c84-107 194-109 285-42 67 49 148 40 218-31 81-82 163-81 242 6 70 73 146 84 228 31" />
        <path d="M95 559c92-118 212-120 311-46 74 55 162 45 240-34 89-90 179-89 266 7 77 80 160 92 250 34" />
      </g>
    </svg>
  )
}

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
  const allHeadings = getArticleHeadings(post.content)
  const headings = allHeadings.filter((heading) => heading.label)
  const headingIds = allHeadings.map((heading) => heading.id)

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
      <ArticleReadingProgress articleId="blog-post" label={dict.blog.readingProgress} />

      <article id="blog-post" className="blog-post">
        {/* Hero region: the header stays pinned while this masthead is on screen
            (see header-frame.tsx).

            The featured image is ALWAYS the backdrop of this band — never a framed
            thumbnail next to the title. It covers the whole hero edge to edge (the `hero`
            upload size, `object-cover`, and the focal point the editor chose in the admin),
            so every post opens on its own photograph regardless of how that photograph was
            cropped on upload. */}
        <header
          data-header-hero
          className="relative isolate flex min-h-[68svh] items-end overflow-hidden bg-ink text-mist md:min-h-[76svh] lg:min-h-[86svh]"
        >
          <PayloadImageFill
            media={post.featuredImage}
            size="hero"
            sizes="100vw"
            priority
            className="-z-10"
            imageClassName="object-cover"
          />
          {/* Scrims do the legibility work: a flat darken so a bright sky can never swallow
              the type, a bottom-up gradient the masthead sits in, and — from `lg` up — a
              left-to-right one that lets the right half of the photograph read as image.
              All three are `-z-10`, like the image itself, so DOM order is paint order. */}
          <div className="absolute inset-0 -z-10 bg-ink/55" aria-hidden="true" />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 -z-10 hidden lg:block lg:bg-gradient-to-r lg:from-ink/85 lg:via-ink/40 lg:to-transparent"
            aria-hidden="true"
          />
          <TopographicLines />
          {/* Hairline frame, so the full-bleed photo still reads as a laid-out page. */}
          <div
            className="pointer-events-none absolute inset-3 z-10 border border-white/20 sm:inset-5 lg:inset-7"
            aria-hidden="true"
          />

          <div className="container-content relative z-10 w-full pt-28 pb-12 md:pt-32 md:pb-16">
            <Breadcrumbs
              className="mb-8 [&_a]:text-mist/65 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-mist/35"
              items={[
                { label: dict.nav.home, href: sitePath('/') },
                { label: dict.nav.blog, href: sitePath('/blog') },
                { label: post.title },
              ]}
            />

            <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2 text-sage">
              <span className="size-1.5 bg-sage" aria-hidden="true" />
              <span>{dict.blog.fieldNotes}</span>
              <span className="text-white/30" aria-hidden="true">
                /
              </span>
              <span className="text-mist/70">{categoryLabel ?? dict.nav.blog}</span>
            </p>

            <div className="mt-6 max-w-[34rem] lg:max-w-[42rem]">
              <h1
                id="post-title"
                className="font-heading text-[clamp(2.6rem,4.7vw,4.9rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-white"
              >
                {post.title}
              </h1>
              <p className="mt-6 max-w-2xl description-copy leading-relaxed text-mist/80 md:leading-[1.75]">
                {post.excerpt}
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-[0.8125rem] text-mist/75">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-sage" aria-hidden="true" />
                <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
              </span>
              <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden="true" />
              <span className="inline-flex items-center gap-2">
                <Clock className="size-4 text-sage" aria-hidden="true" />
                {dict.blog.readTime.replace('{minutes}', String(minutes))}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-white/15 pt-5">
              {authorName ? (
                <div className="flex min-w-0 items-center gap-3">
                  {author?.avatar && typeof author.avatar !== 'number' ? (
                    <PayloadImage
                      media={author.avatar}
                      size="thumbnail"
                      sizes="44px"
                      className="size-11 shrink-0 rounded-full ring-2 ring-sage/45"
                    />
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage/15 font-heading text-base font-semibold text-sage ring-1 ring-sage/30">
                      {authorName.slice(0, 1)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[0.6875rem] tracking-[0.14em] text-mist/50 uppercase">
                      {dict.blog.by}
                    </p>
                    <p className="mt-0.5 truncate font-heading text-[0.9375rem] font-semibold text-white">
                      {authorName}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[0.75rem] tracking-[0.13em] text-mist/60 uppercase">
                  {siteName} <span className="px-1 text-sage/70">/</span> {dict.nav.blog}
                </p>
              )}

              <ArticleShareButton
                title={post.title}
                shareLabel={dict.common.share}
                copiedLabel={dict.common.copied}
                errorLabel={dict.common.shareError}
              />
            </div>
          </div>
        </header>

        <section className="bg-white py-12 md:py-20" aria-labelledby="post-title">
          <div className="container-content">
            {/* Two columns only from `lg` up, because the outline that occupies the right-hand
                column is a desktop affordance. Below that the article keeps its single
                44rem reading measure instead of stretching to the wider grid. */}
            <div
              className={cn(
                'mx-auto max-w-[44rem]',
                headings.length > 0 &&
                  'lg:grid lg:max-w-[65rem] lg:grid-cols-[minmax(0,44rem)_16rem] lg:gap-x-20 lg:gap-y-0',
              )}
            >
              {/* "In this story" is deliberately hidden on mobile and tablet (`< lg`): a
                  numbered index of the article is only useful next to a sticky column, and on
                  a phone it just pushes the story down. `lg:block` re-enables it. */}
              {headings.length > 0 ? (
                <aside className="hidden lg:sticky lg:top-32 lg:col-start-2 lg:row-start-1 lg:block lg:self-start">
                  <nav aria-label={dict.blog.inThisStory} className="border-l border-sage pl-6">
                    <p className="eyebrow text-slate">{dict.blog.inThisStory}</p>
                    <ol className="mt-4 max-h-[calc(100svh-11rem)] space-y-2 overflow-y-auto pr-2">
                      {headings.map((heading, index) => (
                        <li key={heading.id} className={heading.level === 3 ? 'pl-4' : ''}>
                          <a
                            href={`#${heading.id}`}
                            className="group flex items-start gap-3 py-1 text-[0.8125rem] leading-snug text-ink-60 transition-colors hover:text-deep"
                          >
                            <span className="mt-px font-heading text-[0.6875rem] tracking-[0.08em] text-slate/70 tabular-nums">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="group-hover:underline group-hover:decoration-sage group-hover:underline-offset-4">
                              {heading.label}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </nav>
                </aside>
              ) : null}

              {/* The article body — 17px pure-black running copy (see `.single-page-body`). */}
              <div className="single-page-body min-w-0 lg:col-start-1 lg:row-start-1">
                <RichText content={post.content} className="blog-prose" headingIds={headingIds} />

                {authorName && author?.bio ? (
                  <div className="mt-16 flex items-start gap-4 border-t border-slate-20 pt-7">
                    {author.avatar && typeof author.avatar !== 'number' ? (
                      <PayloadImage
                        media={author.avatar}
                        size="thumbnail"
                        sizes="64px"
                        className="size-16 shrink-0 rounded-full ring-4 ring-sage-20"
                      />
                    ) : (
                      <span className="grid size-16 shrink-0 place-items-center rounded-full bg-sage-20 font-heading text-xl font-semibold text-deep">
                        {authorName.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0 pt-1">
                      <p className="eyebrow text-slate">{dict.blog.aboutAuthor}</p>
                      <p className="mt-1 font-heading text-xl font-semibold text-ink">
                        {authorName}
                      </p>
                      <p className="mt-2 description-copy leading-relaxed text-ink-60">
                        {author.bio}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-10 border-t border-slate-20 pt-6">
                  <Link
                    href={sitePath('/blog')}
                    className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-deep transition-colors hover:text-ink"
                  >
                    <ArrowLeft
                      className="size-4 transition-transform group-hover:-translate-x-1"
                      aria-hidden="true"
                    />
                    {dict.blog.backToJournal}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </article>

      <section className="container-content pb-16 md:pb-24" aria-labelledby="next-trail-title">
        <div className="relative isolate overflow-hidden bg-sage-20 p-7 sm:p-9 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:gap-12">
            <div className="max-w-2xl">
              <p className="eyebrow text-deep">{dict.blog.planningEyebrow}</p>
              <h2 id="next-trail-title" className="heading-lg mt-3">
                {dict.blog.planningTitle}
              </h2>
              <p className="mt-4 max-w-xl description-copy leading-relaxed text-ink-60">
                {dict.blog.planningText}
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href={sitePath('/inquiry')}>
                  {dict.blog.planningLink}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div
              aria-hidden="true"
              className="relative hidden size-36 shrink-0 place-items-center rounded-full border border-deep/20 text-deep/75 md:grid lg:mr-5"
            >
              <span className="absolute inset-3 rounded-full border border-deep/15" />
              <span className="absolute inset-7 rounded-full border border-deep/10" />
              <Compass className="size-12" strokeWidth={1} />
            </div>
          </div>
        </div>
      </section>

      {related.length ? (
        <section className="bg-mist py-16 md:py-24">
          <div className="container-content">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow text-slate">{dict.blog.fieldNotes}</p>
                <h2 className="heading-lg mt-2">{dict.blog.related}</h2>
                <p className="mt-3 max-w-xl description-copy leading-relaxed text-ink-60">
                  {dict.blog.relatedSubtitle}
                </p>
              </div>
              <Link
                href={sitePath('/blog')}
                className="group inline-flex shrink-0 items-center gap-2 text-[0.875rem] font-medium text-deep transition-colors hover:text-ink"
              >
                {dict.common.viewAll}
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
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
