'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import type { ResolvedLinkPreview } from '@/lib/link-preview'
import {
  MULTI_URL_PREVIEW_NAME,
  multiPreviewKeyframes,
  nearestPreviewIndex,
  type MultiPreviewAnimation,
  type MultiPreviewLayout,
} from '@/lib/multi-url-preview'

import { LinkPreviewCard } from './link-preview-card'

type Navigation = { index: number; end: number; previous: boolean; next: boolean }

/** Native scroll/snap: no clones, autoplay, drag library, fixed heights or hidden server content. */
export function MultiUrlPreviewRail({
  cards,
  heading,
  description,
  layout,
  animation,
  placement = 'section',
}: {
  cards: ResolvedLinkPreview[]
  heading?: string
  description?: string
  layout: MultiPreviewLayout
  animation: MultiPreviewAnimation
  placement?: 'section' | 'inline'
}) {
  const id = useId()
  const track = useRef<HTMLOListElement>(null)
  const frame = useRef<number | null>(null)
  const settled = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeSlide = useRef(0)
  const running = useRef(new Map<HTMLElement, Animation>())
  const [navigation, setNavigation] = useState<Navigation>({
    index: 0,
    end: 0,
    previous: false,
    next: cards.length > 1,
  })
  const horizontal = layout !== 'list' && cards.length > 1
  const Heading = placement === 'inline' ? 'h3' : 'h2'

  const items = useCallback(() => Array.from(track.current?.children ?? []) as HTMLElement[], [])
  const positions = useCallback(() => {
    const slides = items()
    const first = slides[0]?.offsetLeft ?? 0
    // Layout offsets, not transformed bounding boxes: entrance motion must not move snap points.
    return slides.map((slide) => slide.offsetLeft - first)
  }, [items])

  const syncNavigation = useCallback(() => {
    const viewport = track.current
    if (!viewport) return
    const points = positions()
    const offset = Math.max(0, viewport.scrollLeft)
    const index = nearestPreviewIndex(points, offset)
    const right = offset + viewport.clientWidth
    let end = index
    items().forEach((slide, itemIndex) => {
      if (points[itemIndex] + slide.offsetWidth <= right + 2) end = Math.max(end, itemIndex)
    })
    const updated = {
      index,
      end,
      previous: offset > 2,
      next: offset < viewport.scrollWidth - viewport.clientWidth - 2,
    }
    setNavigation((old) =>
      old.index === updated.index &&
      old.end === updated.end &&
      old.previous === updated.previous &&
      old.next === updated.next
        ? old
        : updated,
    )
  }, [items, positions])

  const scheduleSync = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      syncNavigation()
    })
  }, [syncNavigation])

  const animateItem = useCallback(
    (element: HTMLElement) => {
      if (animation === 'none' || typeof element.animate !== 'function') return
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
      running.current.get(element)?.cancel()
      const effect = element.animate(multiPreviewKeyframes[animation], {
        duration: animation === 'reveal' ? 500 : 420,
        easing: 'cubic-bezier(0.22, 0.68, 0, 1)',
        // No fill: a cancelled effect can never leave the content hidden.
      })
      const effects = running.current
      effects.set(element, effect)
      effect.onfinish = effect.oncancel = () => {
        if (effects.get(element) === effect) effects.delete(element)
      }
    },
    [animation],
  )

  useEffect(() => {
    if (!horizontal) return
    scheduleSync()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleSync)
    if (track.current) observer?.observe(track.current)
    window.addEventListener('resize', scheduleSync)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', scheduleSync)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      if (settled.current !== null) clearTimeout(settled.current)
    }
  }, [horizontal, layout, cards, scheduleSync])

  useEffect(() => {
    const effects = running.current
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const cancel = () => {
      for (const effect of effects.values()) effect.cancel()
      effects.clear()
    }
    const observer =
      animation === 'none' || typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                animateItem(entry.target as HTMLElement)
                observer?.unobserve(entry.target)
              })
            },
            { threshold: 0.15 },
          )
    const slides = items()
    const current = nearestPreviewIndex(positions(), track.current?.scrollLeft ?? 0)
    activeSlide.current = current
    // Observe the current card, including after a live-preview style change midway through a rail.
    const entering =
      layout === 'carousel' && horizontal ? slides.slice(current, current + 1) : slides
    entering.forEach((slide) => observer?.observe(slide))
    motion?.addEventListener?.('change', cancel)
    return () => {
      observer?.disconnect()
      motion?.removeEventListener?.('change', cancel)
      cancel()
    }
  }, [animation, layout, horizontal, cards, items, positions, animateItem])

  const goTo = (index: number) => {
    const viewport = track.current
    if (!viewport) return
    const points = positions()
    const target = Math.max(0, Math.min(points.length - 1, index))
    const reduce =
      animation === 'none' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    viewport.scrollTo({
      left: Math.min(points[target] ?? 0, Math.max(0, viewport.scrollWidth - viewport.clientWidth)),
      behavior: reduce ? 'instant' : 'smooth',
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const slides = items()
    const focused =
      event.target instanceof HTMLElement && event.target.closest('a.link-preview-card')
    const current = focused
      ? slides.findIndex((slide) => slide.contains(focused))
      : navigation.index
    const targets: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: cards.length - 1,
    }
    if (!(event.key in targets)) return
    event.preventDefault()
    const target = Math.max(0, Math.min(cards.length - 1, targets[event.key]))
    goTo(target)
    // Tab still visits every ordinary link. Arrowing from a link moves focus along with the card.
    if (focused)
      slides[target]?.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true })
  }

  const onScroll = () => {
    scheduleSync()
    if (settled.current !== null) clearTimeout(settled.current)
    settled.current = setTimeout(() => {
      if (layout !== 'carousel' || !track.current) return
      const index = nearestPreviewIndex(positions(), track.current.scrollLeft)
      if (index === activeSlide.current) return
      activeSlide.current = index
      const slide = items()[index]
      if (slide) animateItem(slide)
    }, 160)
  }

  if (!cards.length) return null
  const start = Math.min(navigation.index, cards.length - 1) + 1
  const end = Math.min(navigation.end, cards.length - 1) + 1
  const range =
    start === end
      ? String(start).padStart(2, '0')
      : `${String(start).padStart(2, '0')}–${String(end).padStart(2, '0')}`

  return (
    <section
      className={`multi-url-preview multi-url-preview--${placement}`}
      data-layout={layout}
      data-animation={animation}
      data-single={cards.length === 1 ? '' : undefined}
      aria-label={heading ? undefined : MULTI_URL_PREVIEW_NAME}
      aria-labelledby={heading ? `${id}-heading` : undefined}
      aria-roledescription={layout === 'carousel' && horizontal ? 'carousel' : undefined}
    >
      {heading || description ? (
        <header className="multi-url-preview__header">
          {heading ? (
            <Heading id={`${id}-heading`} className="multi-url-preview__heading">
              {heading}
            </Heading>
          ) : null}
          {description ? <p className="multi-url-preview__intro">{description}</p> : null}
        </header>
      ) : null}
      {horizontal ? (
        <p id={`${id}-help`} className="sr-only">
          Use the previous and next buttons, swipe, or focus the list or a link and use Left and
          Right, Home and End keys.
        </p>
      ) : null}
      <ol
        key={layout}
        ref={track}
        id={`${id}-links`}
        className="multi-url-preview__track"
        aria-label="Preview links"
        aria-describedby={horizontal ? `${id}-help` : undefined}
        tabIndex={horizontal ? 0 : undefined}
        onKeyDown={horizontal ? onKeyDown : undefined}
        onScroll={horizontal ? onScroll : undefined}
      >
        {cards.map((card, index) => (
          <li className="multi-url-preview__item" key={`${card.href}-${index}`}>
            <LinkPreviewCard card={card} />
          </li>
        ))}
      </ol>
      {horizontal && (navigation.previous || navigation.next) ? (
        <div className="multi-url-preview__navigation">
          <span className="multi-url-preview__progress" aria-hidden="true">
            <span style={{ width: `${(end / cards.length) * 100}%` }} />
          </span>
          <span className="multi-url-preview__position" aria-live="polite" aria-atomic="true">
            <span aria-hidden="true">
              {range} / {String(cards.length).padStart(2, '0')}
            </span>
            <span className="sr-only">
              Showing {start === end ? 'link' : 'links'} {start}
              {start === end ? '' : ` to ${end}`} of {cards.length}
            </span>
          </span>
          <div className="multi-url-preview__buttons">
            <button
              type="button"
              aria-label="Previous preview"
              aria-controls={`${id}-links`}
              disabled={!navigation.previous}
              onClick={() => goTo(navigation.index - 1)}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next preview"
              aria-controls={`${id}-links`}
              disabled={!navigation.next}
              onClick={() => goTo(navigation.index + 1)}
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
