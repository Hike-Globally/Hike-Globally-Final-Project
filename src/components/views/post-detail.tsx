import { Fragment, type ReactNode } from 'react'
import { CustomHtmlSection } from '@/components/content/custom-html-section'
import { blogSectionOptions, groupPageSections, resolvePageSections } from '@/lib/page-sections'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Clock, Compass } from 'lucide-react'

import { ArticleReadingProgress } from '@/components/blog/article-reading-progress'
import { ArticleShareButton } from '@/components/blog/article-share-button'
import { ArticleTableOfContents } from '@/components/blog/article-table-of-contents'
import { RichText } from '@/components/content/rich-text'
import { PostCard } from '@/components/cards/post-card'
import { CtaCard } from '@/components/blocks/cta'
import { JsonLd } from '@/components/seo/json-ld'
import { Breadcrumbs } from '@/components/sections/breadcrumbs'
import { FaqSection } from '@/components/sections/faq-section'
import { Button } from '@/components/ui/button'
import { PayloadImage, PayloadImageFill } from '@/components/ui/payload-image'
import { blogCategoryLabel, dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { PostCard as PostCardData } from '@/lib/data'
import { getArticleHeadings } from '@/lib/article-headings'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { blogPostingJsonLd, breadcrumbJsonLd, faqJsonLd } from '@/lib/seo'
import { getTripFaqGroups } from '@/lib/trip-faqs'
import { cn } from '@/lib/utils'
import type { Blog } from '@/payload-types'

function TopographicLines() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 -z-10 h-full w-[78%] text-haze/25"
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
  // Keep the masthead and article on the same left edge, with or without an outline.
  const contentWidthClassName = cn(
    'mx-auto max-w-[44rem]',
    headings.length > 0 && 'lg:max-w-[68rem]',
  )

  // Blog posts use the trip FAQ categories, so this is the same grouping the trip page renders.
  const faqGroups = getTripFaqGroups(post)
  const faqs = faqGroups.flatMap(({ faqs: items }) => items)
  const sections = resolvePageSections(post.pageSections, blogSectionOptions)

  const category = post.categories?.[0]
  const categoryLabel = category
    ? (dict.blog[
        `category${category
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join('')}` as keyof typeof dict.blog
      ] ?? category)
    : null

  const sectionContent: Record<string, ReactNode> = {
    hero: (
      <>
        <header
          data-header-hero
          className="hero-region relative isolate flex items-end overflow-hidden bg-ink text-mist"
        >
          <PayloadImageFill
            media={post.featuredImage}
            sizes="100vw"
            priority
            className="-z-10"
            imageClassName="object-cover"
          />
          {/* Scrims do the legibility work: one flat navy wash, so a bright sky can
              never swallow the type, plus the shared bottom-up photo scrim the
              masthead sits in. Both are `-z-10`, like the image itself, so DOM order
              is paint order. */}
          <div className="absolute inset-0 -z-10 bg-ink/72" aria-hidden="true" />
          <div className="photo-scrim absolute inset-0 -z-10" aria-hidden="true" />
          <TopographicLines />
          {/* Hairline frame, so the full-bleed photo still reads as a laid-out page. */}
          <div
            className="pointer-events-none absolute inset-3 z-10 border border-white/20 sm:inset-5 lg:inset-7"
            aria-hidden="true"
          />

          <div className="container-content relative z-10 w-full pt-28 pb-10 sm:pb-12 md:pt-32 md:pb-16">
            <div className={contentWidthClassName}>
              <Breadcrumbs
                className="mb-8 text-mist"
                items={[
                  { label: dict.nav.home, href: sitePath('/') },
                  { label: dict.nav.blog, href: sitePath('/blog') },
                  { label: post.title },
                ]}
              />

              <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2 text-mist">
                <span className="size-1.5 bg-sage" aria-hidden="true" />
                <span>{dict.blog.fieldNotes}</span>
                <span className="text-mist/45" aria-hidden="true">
                  /
                </span>
                <span className="text-mist/85">{categoryLabel ?? dict.nav.blog}</span>
              </p>

              <div className="mt-6 max-w-[34rem] lg:max-w-[42rem]">
                <h1 id="post-title" className="heading-display hero-title text-white">
                  {post.title}
                </h1>
                {/* The excerpt reads the site's hero standfirst, exactly like every other
                    hero on the site (`.hero-description` — see `globals.css`), instead of
                    shrinking to body copy. */}
                <p className="lead hero-description mt-6 max-w-2xl text-mist">{post.excerpt}</p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-small text-mist/85">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-mist" aria-hidden="true" />
                  <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
                </span>
                <span className="hidden h-4 w-px bg-white/20 sm:block" aria-hidden="true" />
                <span className="inline-flex items-center gap-2">
                  <Clock className="size-4 text-mist" aria-hidden="true" />
                  {dict.blog.readTime.replace('{minutes}', String(minutes))}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-white/15 pt-5">
                {authorName ? (
                  <div className="flex min-w-0 items-center gap-3">
                    {author?.avatar && typeof author.avatar !== 'number' ? (
                      <PayloadImage
                        media={author.avatar}
                        sizes="44px"
                        className="size-11 shrink-0 rounded-full ring-1 ring-mist/35"
                      />
                    ) : (
                      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist/12 font-heading text-body font-semibold text-mist ring-1 ring-mist/25">
                        {authorName.slice(0, 1)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-label tracking-[0.14em] text-mist/75 uppercase">
                        {dict.blog.by}
                      </p>
                      <p className="mt-0.5 truncate font-heading text-ui font-semibold text-white">
                        {authorName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-label tracking-[0.13em] text-mist/80 uppercase">
                    {siteName} <span className="px-1 text-mist/60">/</span> {dict.nav.blog}
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
          </div>
        </header>
      </>
    ),
    content: (
      <>
        <RichText content={post.content} className="blog-prose" headingIds={headingIds} />
      </>
    ),
    // Same section as the trip page. Margins rather than the trip's padding, so the gap to the
    // article body and author box collapses into one, whichever order the editor chooses.
    faqs: (
      <FaqSection
        title={dict.blog.faqs}
        groups={faqGroups}
        className="my-16 first:mt-0 last:mb-0 md:my-20"
      />
    ),
    author: (
      <>
        {authorName && author?.bio ? (
          <div className="mt-16 flex items-start gap-4 border-t border-slate-20 pt-7">
            {author.avatar && typeof author.avatar !== 'number' ? (
              <PayloadImage
                media={author.avatar}
                sizes="64px"
                className="size-16 shrink-0 rounded-full ring-1 ring-slate-20"
              />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-mist font-heading text-subhead font-semibold text-ink">
                {authorName.slice(0, 1)}
              </span>
            )}
            <div className="min-w-0 pt-1">
              <p className="eyebrow text-slate-80">{dict.blog.aboutAuthor}</p>
              <p className="mt-1 font-heading text-subhead font-semibold text-ink">{authorName}</p>
              <p className="mt-2 description-copy leading-relaxed text-ink-60">{author.bio}</p>
            </div>
          </div>
        ) : null}
      </>
    ),
    navigation: (
      <>
        <div className="mt-10 border-t border-slate-20 pt-6">
          <Link
            href={sitePath('/blog')}
            className="group inline-flex items-center gap-2 text-ui font-medium text-deep transition-colors hover:text-ink"
          >
            <ArrowLeft
              className="size-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            {dict.blog.backToJournal}
          </Link>
        </div>
      </>
    ),
    planning: (
      <CtaCard
        eyebrow={dict.cta.eyebrow}
        heading={dict.cta.heading}
        text={dict.inquiry.subtitle}
        link={{ href: sitePath('/contact'), label: dict.cta.action }}
        variant="dark"
      />
    ),
    related: (
      <>
        {related.length ? (
          <section className="bg-mist py-16 md:py-24" data-related-rail="">
            <div className="container-content">
              <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow text-slate-80">{dict.blog.fieldNotes}</p>
                  <h2 className="heading-lg mt-2 text-ink">{dict.blog.related}</h2>
                  <p className="mt-3 max-w-xl description-copy leading-relaxed text-ink-60">
                    {dict.blog.relatedSubtitle}
                  </p>
                </div>
                <Link
                  href={sitePath('/blog')}
                  className="group inline-flex shrink-0 items-center gap-2 text-small font-medium text-deep transition-colors hover:text-ink"
                >
                  {dict.common.viewAll}
                  <ArrowUpRight
                    className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
              <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
                {related.map((item) => (
                  <PostCard key={item.id} post={item} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </>
    ),
  }
  const groups = groupPageSections(sections, ['hero', 'planning', 'related'])

  return (
    <>
      <ArticleReadingProgress articleId="blog-post" label={dict.blog.readingProgress} />
      <article id="blog-post" className="blog-post">
        {groups.map((group, groupIndex) => {
          const content = group.sections.map((section, index) => (
            <Fragment key={section.id ?? `${section.kind}-${index}`}>
              {section.kind === 'html' ? (
                <CustomHtmlSection section={section} />
              ) : (
                sectionContent[section.kind]
              )}
            </Fragment>
          ))
          if (group.fullWidth) return <Fragment key={groupIndex}>{content}</Fragment>
          const hasOutline =
            headings.length > 0 && group.sections.some(({ kind }) => kind === 'content')
          return (
            <Fragment key={groupIndex}>
              <section className="bg-white py-12 md:py-20" aria-labelledby="post-title">
                <div className="container-content">
                  {/* Two columns only from `lg` up, because the outline that occupies the right-hand
                column is a desktop affordance. Below that the article keeps its single
                44rem reading measure instead of stretching to the wider grid. */}
                  <div
                    className={cn(
                      hasOutline ? contentWidthClassName : 'mx-auto max-w-[44rem]',
                      hasOutline &&
                        'lg:grid lg:grid-cols-[minmax(0,44rem)_18rem] lg:gap-x-12 lg:gap-y-0',
                    )}
                  >
                    {/* Keep the reading outline beside the story on desktop, not above it on mobile. */}
                    {hasOutline ? (
                      <aside className="hidden lg:sticky lg:top-32 lg:col-start-2 lg:row-start-1 lg:block lg:self-start">
                        <ArticleTableOfContents
                          headings={headings}
                          label={dict.blog.inThisStory}
                          eyebrow={dict.blog.fieldNotes}
                          readingTime={dict.blog.readTime.replace('{minutes}', String(minutes))}
                        />
                      </aside>
                    ) : null}

                    {/* The article body — 17px pure-black running copy (see `.single-page-body`). */}
                    <div className="single-page-body min-w-0 lg:col-start-1 lg:row-start-1">
                      {content}
                    </div>
                  </div>
                </div>
              </section>
            </Fragment>
          )
        })}
      </article>

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
            // The Media document, not its `url`: `schemaImageUrl()` turns it into the absolute URL
            // structured data requires (a relative one is dropped from the rich result).
            image: post.featuredImage,
            siteName,
            categories: (post.categories ?? []).map(blogCategoryLabel),
          }),
          ...(faqs.length && sections.some(({ kind }) => kind === 'faqs')
            ? [faqJsonLd(faqs.map((faq) => ({ question: faq.question, answer: faq.answer ?? '' })))]
            : []),
        ]}
      />
    </>
  )
}
