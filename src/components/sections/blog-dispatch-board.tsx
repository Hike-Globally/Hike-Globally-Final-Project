'use client'

import Link from 'next/link'
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { PayloadImageFill } from '@/components/ui/payload-image'
import { sitePath } from '@/i18n/config'
import { blogCategoryLabel, dictionary } from '@/i18n/dictionaries'
import type { PostCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { cn } from '@/lib/utils'

import { HOMEPAGE_POST_LIMIT } from './latest-blogs-limits'

/**
 * ============================================================================
 * THE JOURNAL BOARD — the homepage's "Latest Blogs and Stories" cards.
 * ============================================================================
 * An editorial split rather than a fourth row of identical cards:
 *
 *   • the newest story is a full-bleed photographic *plate* (7 of 12 columns) —
 *     category flag, oversized Instrument-Serif index numeral, title, standfirst,
 *     byline and a "Read story" cue over a slow Ken Burns breathe;
 *   • the stories behind it are an *index* of numbered waypoints (5 of 12) running
 *     down a hairline route, each one a whole-row link with its category, title,
 *     thumbnail and byline;
 *   • on a desktop pointer, a preview plate glides after the cursor down that
 *     index and cross-fades to the story being hovered — the one piece of theatre
 *     in the section, and the reason the index feels like a stack of photographs
 *     rather than a list of links.
 *
 * The index is capped at three rows (`latest-blogs-limits.ts`) — the lead plus
 * three. Three compact rows balance the plate; more of them make the index
 * taller than the photograph and the section reads as a long, portrait list.
 * The rows are deliberately terse (category, title, byline, thumbnail): the
 * standfirst belongs to the lead, where it has room.
 *
 * Both columns are the same height (the taller of the two sets it, the index
 * foot is pinned with `mt-auto`), so the board reads as one object at any
 * number of posts from two to four. Everything below `lg` collapses to a single
 * column and the preview plate is never mounted — a phone gets the same board,
 * minus the cursor theatre it could never use.
 *
 * The choreography itself (wipes, spine, waypoint fill, breathe, reduced-motion
 * opt-outs) lives in `latest-blogs-section.css`; the sizes come from the homepage
 * type scale in `homepage.css`. What is here is structure, CMS content mapping and
 * the pointer-following plate.
 */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const postHref = (post: PostCard): string => sitePath(`/blog/${post.slug}`)

/** Payload returns the relationship as an id when the author is unpublished. */
const postAuthor = (post: PostCard): string | null =>
  post.author && typeof post.author !== 'number' ? (post.author.name ?? null) : null

const postCategory = (post: PostCard): string | null => {
  const first = post.categories?.[0]
  return first ? blogCategoryLabel(first) : null
}

const postDate = (post: PostCard): string => (post.publishedAt ?? post.createdAt) as string

const readTime = (post: PostCard): string =>
  dictionary.blog.readTime.replace('{minutes}', String(readingTimeMinutes(post.content)))

export function BlogDispatchBoard({ posts }: { posts: PostCard[] }) {
  const dict = dictionary
  // The section already fetches exactly the board's measure; slicing again keeps
  // the three-row maximum a property of the board itself, whatever calls it.
  const [lead, ...rest] = posts.slice(0, HOMEPAGE_POST_LIMIT)

  const boardRef = useRef<HTMLDivElement | null>(null)
  const plateRef = useRef<HTMLDivElement | null>(null)
  const [activeRow, setActiveRow] = useState<number | null>(null)
  const [plateEnabled, setPlateEnabled] = useState(false)
  // The plate is *jumped* to the cursor the first time it appears instead of
  // springing in from the board's top-left corner, then glides from there on.
  const needsJump = useRef(true)

  const plateX = useMotionValue(0)
  const plateY = useMotionValue(0)
  const x = useSpring(plateX, { stiffness: 260, damping: 30, mass: 0.6 })
  const y = useSpring(plateY, { stiffness: 260, damping: 30, mass: 0.6 })

  /* The preview plate only exists for a fine pointer on a wide canvas, and never
     for a visitor who asked for less motion. Checked after mount (with listeners,
     so rotating a tablet or toggling the OS setting is picked up) which also keeps
     the server HTML and the first client render identical. */
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const wide = window.matchMedia('(min-width: 64rem)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')

    const update = (): void => setPlateEnabled(fine.matches && wide.matches && !calm.matches)

    update()
    for (const query of [fine, wide, calm]) query.addEventListener('change', update)
    return () => {
      for (const query of [fine, wide, calm]) query.removeEventListener('change', update)
    }
  }, [])

  /** Board-relative point for the plate, kept inside the board so it can never
   *  hang over the column edge and get clipped by the page. */
  const placePlate = (pointX: number, pointY: number, jump: boolean): void => {
    const board = boardRef.current
    const plate = plateRef.current
    if (!board || !plate) return

    const rect = board.getBoundingClientRect()
    const halfWidth = plate.offsetWidth / 2
    const halfHeight = plate.offsetHeight / 2

    plateX.set(clamp(pointX - rect.left, halfWidth, Math.max(halfWidth, rect.width - halfWidth)))
    plateY.set(clamp(pointY - rect.top, halfHeight, Math.max(halfHeight, rect.height - halfHeight)))

    if (jump) {
      x.jump(plateX.get())
      y.jump(plateY.get())
      needsJump.current = false
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!plateEnabled || activeRow === null) return
    placePlate(event.clientX, event.clientY, needsJump.current)
  }

  /** Keyboard focus has no cursor to follow, so the plate parks beside the row
   *  that has focus instead — the same story, reachable without a pointer. */
  const handleRowFocus = (event: ReactFocusEvent<HTMLAnchorElement>, position: number): void => {
    setActiveRow(position)
    if (!plateEnabled) return

    const row = event.currentTarget.getBoundingClientRect()
    placePlate(row.left + row.width * 0.34, row.top + row.height / 2, true)
  }

  if (!lead) return null

  const leadAuthor = postAuthor(lead)
  const leadTitleId = 'blog-dispatch-lead-title'

  return (
    <div
      ref={boardRef}
      className="lb-board relative grid gap-10 lg:grid-cols-12 xl:gap-x-12"
      onPointerMove={handlePointerMove}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Lead plate                                                          */}
      {/* ------------------------------------------------------------------ */}
      {/* 6/6 from `lg`, then the more dramatic 7/5 editorial split from `xl` up: at
          1024px a 5/12 index column would leave a 23px title barely 170px to wrap
          in once the waypoint, thumbnail and arrow have taken their share. */}
      <Reveal
        className={cn('min-w-0', rest.length ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12')}
      >
        <article
          className={cn(
            'lb-lead group relative isolate flex h-full min-h-[min(26rem,75svh)] flex-col justify-between overflow-hidden bg-ink text-mist',
            'lg:min-h-[30rem] 3xl:min-h-[34rem]',
          )}
        >
          {/* One link for the whole plate, stretched over it and above the copy —
              the same arrangement `destination-card.tsx` uses, so a tap anywhere
              (photo, title, empty space) opens the story. */}
          <Link
            href={postHref(lead)}
            aria-labelledby={leadTitleId}
            className="absolute inset-0 z-10 focus-visible:outline-offset-[-5px]"
          />

          <div className="absolute inset-0 -z-10">
            {/* The still wrapper the hover zoom composes over. */}
            <div className="lb-breath absolute inset-0 overflow-hidden">
              <PayloadImageFill
                media={lead.featuredImage}
                sizes="(min-width: 1920px) 44vw, (min-width: 1024px) 56vw, 92vw"
                className="transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035] group-focus-within:scale-[1.035]"
              />
            </div>
            {/* The site's one navy scrim, so the copy stays legible over any photo. */}
            <div className="photo-scrim absolute inset-0" aria-hidden="true" />
          </div>

          {/* Ember rule drawn across the foot of the plate on hover / focus. */}
          <span
            className="lb-lead-rule absolute inset-x-0 bottom-0 h-0.5 bg-sage"
            aria-hidden="true"
          />

          <div className="pointer-events-none flex items-start justify-between gap-4 p-6 sm:p-8 lg:p-9">
            <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 font-heading text-label font-medium tracking-[0.16em] text-ink uppercase">
              <span className="lb-live" aria-hidden="true" />
              {postCategory(lead) ?? dict.nav.blog}
            </span>
            {/* The plate's index numeral — the display serif in its italic cut, the
                accent voice the hero's second line uses, so the board ties back to
                the top of the page. Purely decorative: the index rows continue the
                count. */}
            <span
              className="lb-numeral -mt-1 text-hero text-mist/16"
              aria-hidden="true"
            >
              01
            </span>
          </div>

          <div className="pointer-events-none p-6 sm:p-8 lg:p-9">
            <h3
              id={leadTitleId}
              className="home-blog-lead-title max-w-[33rem] break-words text-white"
            >
              {lead.title}
            </h3>

            <p
              className="home-blog-description mt-4 max-w-[36rem] line-clamp-3 card-description-copy leading-relaxed text-mist/85"
            >
              {lead.excerpt}
            </p>

            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-small text-mist/75">
              {leadAuthor ? <span>{`${dict.blog.by} ${leadAuthor}`}</span> : null}
              {leadAuthor ? <span aria-hidden="true">·</span> : null}
              <time dateTime={postDate(lead)}>{formatDate(postDate(lead))}</time>
              {lead.content ? <span aria-hidden="true">·</span> : null}
              {lead.content ? <span>{readTime(lead)}</span> : null}
            </p>

            <div className="mt-7 border-t border-mist/20 pt-5">
              <span className="inline-flex items-center gap-2.5 font-heading text-label font-medium tracking-[0.16em] text-mist uppercase">
                {dict.blog.readStory}
                <ArrowRight
                  className="size-4 text-sage transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 group-focus-within:translate-x-1.5"
                  aria-hidden="true"
                />
              </span>
            </div>
          </div>
        </article>
      </Reveal>

      {/* ------------------------------------------------------------------ */}
      {/* Index of waypoints                                                  */}
      {/* ------------------------------------------------------------------ */}
      {rest.length ? (
        <Reveal className="min-w-0 lg:col-span-6 xl:col-span-5" delay={120}>
          <div className="lb-stack flex h-full min-w-0 flex-col">
            {/* Leaving the *index* (not the whole column) drops the plate, so it
                never follows the cursor down over the foot link below. */}
            <ol
              className="lb-rows min-w-0"
              onPointerLeave={() => {
                setActiveRow(null)
                needsJump.current = true
              }}
            >
              {rest.map((post, position) => {
                const titleId = `blog-dispatch-row-${position}-title`
                const author = postAuthor(post)

                return (
                  <li key={post.id} className="lb-row group min-w-0">
                    <Link
                      href={postHref(post)}
                      aria-labelledby={titleId}
                      onPointerEnter={() => setActiveRow(position)}
                      onFocus={(event) => handleRowFocus(event, position)}
                      onBlur={() => setActiveRow(null)}
                      className="relative z-[1] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-4 py-5 focus-visible:outline-offset-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:gap-x-5 sm:py-6"
                    >
                      <span className="lb-row-rail" aria-hidden="true" />

                      {/* Waypoint — the row's place in the index, and the marker the
                          route line runs between. */}
                      <span
                        className="lb-node relative z-[1] grid size-[1.875rem] shrink-0 place-items-center border border-slate-40 bg-white font-heading text-label font-medium tabular-nums text-slate-80"
                        aria-hidden="true"
                      >
                        {String(position + 2).padStart(2, '0')}
                      </span>

                      {/* A `div`, not a `span`: it holds the row's `<h3>`, and a
                          heading is not phrasing content. The `<a>` around it has a
                          transparent content model, so flow content is legal here. */}
                      <div className="lb-row-body min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-heading text-label font-medium tracking-[0.14em] uppercase">
                          <span className="text-deep-90">{postCategory(post) ?? dict.nav.blog}</span>
                          {post.content ? <span className="text-slate-40" aria-hidden="true">
                            /
                          </span> : null}
                          {post.content ? <span className="text-slate-80">{readTime(post)}</span> : null}
                        </p>

                        <h3
                          id={titleId}
                          className="home-blog-row-title mt-1.5 font-heading leading-snug font-semibold break-words text-ink transition-colors duration-300 group-hover:text-deep-90 group-focus-within:text-deep-90"
                        >
                          {post.title}
                        </h3>

                        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-small text-slate-80">
                          {author ? <span>{`${dict.blog.by} ${author}`}</span> : null}
                          {author ? <span aria-hidden="true">·</span> : null}
                          <time dateTime={postDate(post)}>{formatDate(postDate(post))}</time>
                        </p>
                      </div>

                      <span
                        className="lb-row-thumb relative hidden size-16 shrink-0 overflow-hidden bg-mist xs:block lg:size-20"
                        aria-hidden="true"
                      >
                        <PayloadImageFill
                          media={post.featuredImage}
                          alt=""
                          sizes="80px"
                          className="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] group-focus-within:scale-[1.08]"
                        />
                      </span>

                      <span
                        className="hidden size-9 shrink-0 place-items-center rounded-[7px] border border-ink/20 bg-paper text-ink transition-colors duration-300 group-hover:border-btn-primary group-hover:bg-btn-primary group-hover:text-white group-focus-within:border-btn-primary group-focus-within:bg-btn-primary group-focus-within:text-white sm:grid"
                        aria-hidden="true"
                      >
                        <ArrowUpRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-slate-20 pt-5">
              <span className="font-heading text-label font-medium tracking-[0.16em] text-slate-80 uppercase">
                {dict.blog.fieldNotes}
              </span>
              <Link
                href={sitePath('/blog')}
                className="group/foot inline-flex items-center gap-2 text-ui font-medium text-deep transition-colors hover:text-deep-80 focus-visible:text-deep-80 focus-visible:outline-offset-4"
              >
                {dict.blog.browseJournal}
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover/foot:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </Reveal>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Cursor-following preview plate                                      */}
      {/* ------------------------------------------------------------------ */}
      {/* Mounted only for a fine pointer on a wide canvas (see the effect above).
          `motion` owns the position (springs, so it glides a beat behind the
          cursor); CSS owns the centring, tilt and scale, so neither overwrites
          the other's transform. Every row's plate stays mounted and cross-fades,
          so jumping down the index never waits on a decode. */}
      {plateEnabled && rest.length ? (
        <motion.div
          ref={plateRef}
          className="lb-preview"
          data-active={activeRow !== null}
          style={{ x, y }}
          aria-hidden="true"
        >
          <div className="lb-preview-inner">
            {rest.map((post, position) => (
              <div key={post.id} className="lb-preview-frame" data-active={activeRow === position}>
                <PayloadImageFill
                  media={post.featuredImage}
                  alt=""
                  sizes="(min-width: 120rem) 320px, 280px"
                />
                <span className="lb-preview-caption">{postCategory(post) ?? dict.nav.blog}</span>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
