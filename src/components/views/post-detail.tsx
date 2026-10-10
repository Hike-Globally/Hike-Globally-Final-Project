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
        <header className="relative isolate overflow-hidden bg-ink text-mist">
          <TopographicLines />

          <div className="container-content pt-28 md:pt-32">
            <Breadcrumbs
              className="mb-8 [&_a]:text-mist/65 [&_a:hover]:text-white [&_span]:text-white [&_svg]:text-mist/35"
              items={[
                { label: dict.nav.home, href: sitePath('/') },
                { label: dict.nav.blog, href: sitePath('/blog') },
                { label: post.title },
              ]}
            />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-12">
              <div className="relative z-10 flex flex-col justify-center py-2 pb-7 sm:pb-10 lg:py-12">
                <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2 text-sage">
                  <span className="size-1.5 bg-sage" aria-hidden="true" />
                  <span>{dict.blog.fieldNotes}</span>
                  <span className="text-white/30" aria-hidden="true">
                    /
                  </span>
                  <span className="text-mist/70">{categoryLabel ?? dict.nav.blog}</span>
                </p>

                <h1
                  id="post-title"
                  className="mt-6 max-w-[12ch] font-heading text-[clamp(2.8rem,5.1vw,5.35rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-white"
                >
                  {post.title}
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-mist/75 md:text-[1.0625rem] md:leading-[1.75]">
                  {post.excerpt}
                </p>

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

              <figure className="group relative isolate aspect-[4/3] min-h-[18rem] overflow-hidden bg-deep sm:min-h-[24rem] lg:aspect-auto lg:min-h-[36rem]">
                <PayloadImageFill
                  media={post.featuredImage}
                  size="hero"
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  priority
                  imageClassName="transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/15 via-transparent to-ink/45"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-4 border border-white/25"
                  aria-hidden="true"
                />
                <div className="absolute left-7 top-7 inline-flex items-center gap-2 border border-white/25 bg-ink/45 px-3 py-2 text-[0.6875rem] tracking-[0.15em] text-white uppercase backdrop-blur-sm">
                  <span className="size-1.5 bg-sage" aria-hidden="true" />
                  {dict.blog.fieldNotes}
                </div>
                <div className="absolute right-7 bottom-7 grid size-14 place-items-center border border-white/35 bg-ink/15 text-white backdrop-blur-sm">
                  <Compass className="size-6" strokeWidth={1.25} aria-hidden="true" />
                </div>
              </figure>
            </div>
          </div>
        </header>

        <section className="bg-white py-12 md:py-20" aria-labelledby="post-title">
          <div className="container-content">
            <div
              className={
                headings.length
                  ? 'mx-auto grid max-w-[65rem] gap-8 lg:grid-cols-[minmax(0,44rem)_16rem] lg:gap-x-20 lg:gap-y-0'
                  : 'mx-auto max-w-[44rem]'
              }
            >
              {headings.length > 0 ? (
                <aside className="lg:sticky lg:top-32 lg:col-start-2 lg:row-start-1 lg:self-start">
                  <nav
                    aria-label={dict.blog.inThisStory}
                    className="border-l-2 border-sage bg-mist p-5 sm:p-6 lg:border-l lg:bg-transparent lg:p-0 lg:pl-6"
                  >
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

              <div className={headings.length ? 'min-w-0 lg:col-start-1 lg:row-start-1' : ''}>
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
                      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-60">
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
              <p className="mt-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-60 md:text-base">
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
                <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-60">
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
