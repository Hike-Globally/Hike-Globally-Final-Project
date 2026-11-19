'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import './trip-section-nav.css'

export type TripSectionNavItem = {
  id: string
  label: string
}

/**
 * Sticky in-page navigation for the primary trip sections. Scrolling updates one shared underline,
 * which slides between labels; anchor clicks continue through the site's Lenis smooth-scroll handler.
 */
export function TripSectionNav({ items }: { items: TripSectionNavItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '')
  const [indicator, setIndicator] = useState({ x: 0, width: 0 })
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const trackRef = useRef<HTMLDivElement | null>(null)
  const linksRef = useRef(new Map<string, HTMLAnchorElement>())

  useEffect(() => {
    if (!items.length) return

    const updateActiveSection = () => {
      const track = trackRef.current
      const activationLine = (track?.getBoundingClientRect().height ?? 56) + 16
      let nextId = items[0].id

      for (const item of items) {
        const section = document.getElementById(item.id)
        if (section && section.getBoundingClientRect().top <= activationLine) nextId = item.id
        else break
      }

      setActiveId((current) => (current === nextId ? current : nextId))
    }

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        updateActiveSection()
      })
    }

    updateActiveSection()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [items])

  useLayoutEffect(() => {
    const scroll = scrollRef.current
    const track = trackRef.current
    const link = linksRef.current.get(activeId)
    if (!scroll || !track || !link) return

    const measure = () => {
      const trackRect = track.getBoundingClientRect()
      const linkRect = link.getBoundingClientRect()
      const scrollRect = scroll.getBoundingClientRect()
      setIndicator({ x: linkRect.left - trackRect.left, width: linkRect.width })

      // Keep the active item and its moving underline visible in the narrow, swipeable menu.
      const inset = 12
      const delta =
        linkRect.left < scrollRect.left + inset
          ? linkRect.left - scrollRect.left - inset
          : linkRect.right > scrollRect.right - inset
            ? linkRect.right - scrollRect.right + inset
            : 0
      if (delta) {
        scroll.scrollBy({
          left: delta,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
      }
    }

    measure()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    if (observer) {
      observer.observe(track)
      observer.observe(link)
    }
    window.addEventListener('resize', measure)

    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [activeId, items])

  if (!items.length) return null

  return (
    <nav className="trip-section-nav" aria-label="Trip sections">
      <div className="container-content">
        <div className="trip-section-nav__scroll" ref={scrollRef}>
          <div className="trip-section-nav__track" ref={trackRef}>
            {items.map(({ id, label }) => (
              <a
                key={id}
                ref={(element) => {
                  if (element) linksRef.current.set(id, element)
                  else linksRef.current.delete(id)
                }}
                href={`#${id}`}
                aria-current={activeId === id ? 'location' : undefined}
                className="trip-section-nav__link"
              >
                {label}
              </a>
            ))}
            <span
              className="trip-section-nav__indicator"
              aria-hidden="true"
              style={{ transform: `translateX(${indicator.x}px)`, width: indicator.width }}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
