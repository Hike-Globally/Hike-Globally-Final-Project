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
 *     standfirst, thumbnail and byline;
 *   • on a desktop pointer, a preview plate glides after the cursor down that
 *     index and cross-fades to the story being hovered — the one piece of theatre
 *     in the section, and the reason the index feels like a stack of photographs
 *     rather than a list of links.
 *
 * Both columns are the same height (the plate's `min-height` sets it, the index
 * foot is pinned with `mt-auto`), so the board reads as one object at any number
 * of posts from two upwards. Everything below `lg` collapses to a single column
 * and the preview plate is never mounted — a phone gets the same board, minus the
 * cursor theatre it could never use.
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
  dictionary.blog.readTime.replace('{minutes}', String(readingTimeMinutes(post.excerpt ?? '')))

export function BlogDispatchBoard({ posts }: { posts: PostCard[] }) {
  const dict = dictionary
  const [lead, ...rest] = posts

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
            'lb-lead group relative isolate flex h-full min-h-[min(30rem,82svh)] flex-col justify-between overflow-hidden bg-ink text-mist',
            'shadow-[0_28px_60px_-44px_rgba(1,22,30,0.75)] lg:min-h-[34rem] 3xl:min-h-[40rem]',
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
            {/* Breathe on the wrapper, hover zoom on the image: two transforms that
                compose instead of overwriting each other. */}
            <div className="lb-breath absolute inset-0 overflow-hidden">
              <PayloadImageFill
                media={lead.featuredImage}
                size="tablet"
                sizes="(min-width: 1920px) 44vw, (min-width: 1024px) 56vw, 92vw"
                className="transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05] group-focus-within:scale-[1.05]"
              />
            </div>
            {/* Flat wash + bottom-up gradient, so the copy stays legible over any photo. */}
            <div className="absolute inset-0 bg-ink/30" aria-hidden="true" />
            <div
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/72 to-ink/10"
              aria-hidden="true"
            />
          </div>

          {/* Sage rule drawn across the foot of the plate on hover / focus. */}
          <span
            className="lb-lead-rule absolute inset-x-0 bottom-0 h-[3px] bg-sage"
            aria-hidden="true"
          />

          <div className="pointer-events-none flex items-start justify-between gap-4 p-6 sm:p-8 lg:p-9">
            <span className="inline-flex items-center gap-2 bg-sage px-3 py-1.5 font-heading text-[0.6875rem] font-semibold tracking-[0.18em] text-ink uppercase">
              <span className="lb-live" aria-hidden="true" />
              {postCategory(lead) ?? dict.nav.blog}
            </span>
            {/* The plate's index numeral — Instrument Serif italic, the accent face
                the hero's second line uses, so the board ties back to the top of
                the page. Purely decorative: the index rows continue the count. */}
            <span
              className="lb-numeral -mt-1 text-[4.5rem] text-white/14 sm:text-[6rem]"
              aria-hidden="true"
            >
              01
            </span>
          </div>

          <div className="pointer-events-none p-6 sm:p-8 lg:p-9">
            <h3
              id={leadTitleId}
              className="home-blog-lead-title max-w-[33rem] font-heading font-semibold break-words text-white"
            >
              {lead.title}
            </h3>

            <p
              className="home-blog-description mt-4 max-w-[36rem] line-clamp-3 card-description-copy leading-relaxed text-white/80"
            >
              {lead.excerpt}
            </p>

            <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.8125rem] text-white/65">
              {leadAuthor ? <span>{`${dict.blog.by} ${leadAuthor}`}</span> : null}
              {leadAuthor ? <span aria-hidden="true">·</span> : null}
              <time dateTime={postDate(lead)}>{formatDate(postDate(lead))}</time>
              <span aria-hidden="true">·</span>
              <span>{readTime(lead)}</span>
            </p>

            <div className="mt-7 border-t border-white/15 pt-5">
              <span className="inline-flex items-center gap-2.5 font-heading text-[0.75rem] font-semibold tracking-[0.18em] text-white uppercase">
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
                        className="lb-node relative z-[1] grid size-[1.875rem] shrink-0 place-items-center border border-ink/12 bg-white font-heading text-[0.6875rem] font-semibold tabular-nums text-slate"
                        aria-hidden="true"
                      >
                        {String(position + 2).padStart(2, '0')}
                      </span>

                      {/* A `div`, not a `span`: it holds the row's `<h3>`, and a
                          heading is not phrasing content. The `<a>` around it has a
                          transparent content model, so flow content is legal here. */}
                      <div className="lb-row-body min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-heading text-[0.6875rem] font-semibold tracking-[0.16em] uppercase">
                          <span className="text-deep">{postCategory(post) ?? dict.nav.blog}</span>
                          <span className="text-slate/50" aria-hidden="true">
                            /
                          </span>
                          <span className="text-slate">{readTime(post)}</span>
                        </p>

                        <h3
                          id={titleId}
                          className="home-blog-row-title mt-1.5 font-heading leading-snug font-semibold break-words text-ink transition-colors duration-300 group-hover:text-deep group-focus-within:text-deep"
                        >
                          {post.title}
                        </h3>

                        {/* Two nested elements on purpose: the outer one owns the
                            `hidden`/`block` switch, the inner one the `-webkit-box`
                            display `line-clamp` needs — one element cannot carry both. */}
                        <div className="mt-2 hidden sm:block">
                          <p
                            className="home-blog-description line-clamp-2 card-description-copy leading-relaxed text-ink-60"
                          >
                            {post.excerpt}
                          </p>
                        </div>

                        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-slate">
                          {author ? <span>{`${dict.blog.by} ${author}`}</span> : null}
                          {author ? <span aria-hidden="true">·</span> : null}
                          <time dateTime={postDate(post)}>{formatDate(postDate(post))}</time>
                        </p>
                      </div>

                      <span
                        className="lb-row-thumb relative hidden size-16 shrink-0 overflow-hidden bg-mist-60 xs:block lg:size-20"
                        aria-hidden="true"
                      >
                        <PayloadImageFill
                          media={post.featuredImage}
                          alt=""
                          size="thumbnail"
                          sizes="80px"
                          className="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.08] group-focus-within:scale-[1.08]"
                        />
                      </span>

                      <span
                        className="hidden size-9 shrink-0 place-items-center rounded-full border border-ink/10 text-ink transition-colors duration-300 group-hover:border-deep group-hover:bg-deep group-hover:text-mist group-focus-within:border-deep group-focus-within:bg-deep group-focus-within:text-mist sm:grid"
                        aria-hidden="true"
                      >
                        <ArrowUpRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-ink/10 pt-5">
              <span className="font-heading text-[0.6875rem] font-semibold tracking-[0.18em] text-slate uppercase">
                {dict.blog.fieldNotes}
              </span>
              <Link
                href={sitePath('/blog')}
                className="group/foot inline-flex items-center gap-2 text-[0.9375rem] font-medium text-deep transition-colors hover:text-ink focus-visible:text-ink focus-visible:outline-offset-4"
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
                  size="card"
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
