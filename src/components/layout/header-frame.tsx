'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'

/* ============================================================================
   Global header — scroll-aware show / hide
   ----------------------------------------------------------------------------
   1. HERO REGIONS ARE ALWAYS VISIBLE. Any component can mark the element that
      closes its hero region with the `data-header-hero` attribute; the header
      stays pinned while that element's bottom edge is still below the top of
      the viewport. `HeroScrollCover` drops a zero-height sentinel on top of its
      covering surface, so on the homepage the header stays pinned until the
      Hero has been completely covered — and it is pinned over every other
      page's opening band (listing banners, page headers, article mastheads).
   2. EVERYWHERE ELSE THE HEADER HIDES AS SOON AS THE PAGE SCROLLS.
   3. POINTER MOVEMENT DOES NOT REVEAL OR PIN THE HEADER. Keyboard focus inside
      the header and an open navigation menu still hold it in place.
   4. TOUCH SCREENS can bring the header back while scrolling up
      (`REVEAL_ON_SCROLL_UP`).
   ========================================================================== */

/** Selector for the element that ends a page's hero region — see note 1. */
const HERO_MARKER = '[data-header-hero]'

/** Scroll offsets at or below this still count as "the top of the page" (px). */
const TOP_EDGE = 8

/** Slack added to the measured header height when sliding it off-screen (px). */
const HIDE_GAP = 12

/** Only touch devices reveal the header on upward scroll. */
const REVEAL_ON_SCROLL_UP: 'none' | 'touch' | 'all' = 'touch'

/* Hide = accelerate away, reveal = decelerate into place (cubic-bezier tuples). */
const EASE_IN: [number, number, number, number] = [0.32, 0.06, 0.72, 0.16]
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

/**
 * The global header's frame: a zero-height sticky overlay that owns the
 * auto-hide behaviour, so every page gets it without opting in.
 *
 * It renders nothing visual of its own — `<Header />` puts the announcement
 * bar and pill nav inside it.
 */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  const headerRef = useRef<HTMLElement | null>(null)
  const lastYRef = useRef(0)
  const coarsePointerRef = useRef(false)

  /** Page is inside a marked hero region (or has not scrolled yet). */
  const [inHero, setInHero] = useState(true)
  /** Keyboard focus is inside the header. */
  const [focused, setFocused] = useState(false)
  /** A touch scroll-up gesture asked for the header — see note 4. */
  const [scrollRevealed, setScrollRevealed] = useState(false)
  /** Open mobile sheet: the menu must not slide away while it is being used. */
  const [menuOpen, setMenuOpen] = useState(false)
  /** Open desktop/tablet dropdown or mega menu: keep the header pinned on touch tablets too. */
  const [panelOpen, setPanelOpen] = useState(false)
  /** Travel distance when hiding — measured, so both breakpoints work. */
  const [hideDistance, setHideDistance] = useState(160)

  const revealed = focused || scrollRevealed || menuOpen || panelOpen
  const hidden = !inHero && !revealed

  /* -- hero region --------------------------------------------------------- */

  const syncHero = useCallback(() => {
    if (window.scrollY <= TOP_EDGE) {
      setInHero(true)
      return
    }
    for (const marker of document.querySelectorAll(HERO_MARKER)) {
      // The hero region lasts until its closing edge leaves the top of the viewport.
      if (marker.getBoundingClientRect().bottom > 0) {
        setInHero(true)
        return
      }
    }
    setInHero(false)
  }, [])

  /* -- measuring ----------------------------------------------------------- */

  const measureHideDistance = useCallback(() => {
    const header = headerRef.current
    if (!header) return
    // Layout metrics, not client rects: they are immune to the transform we animate.
    let bottom = 0
    for (const child of Array.from(header.children)) {
      const element = child as HTMLElement
      bottom = Math.max(bottom, element.offsetTop + element.offsetHeight)
    }
    if (bottom > 0) setHideDistance(bottom + HIDE_GAP)
  }, [])

  /* -- scroll: hero tracking, hide-on-scroll, touch reveal ------------------ */

  useEffect(() => {
    lastYRef.current = window.scrollY

    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      const previous = lastYRef.current
      lastYRef.current = y

      syncHero()

      if (y <= TOP_EDGE) {
        setScrollRevealed(false)
        return
      }

      const touchesOnly = REVEAL_ON_SCROLL_UP === 'touch' && coarsePointerRef.current
      const revealOnScrollUp = REVEAL_ON_SCROLL_UP === 'all' || touchesOnly
      if (revealOnScrollUp && y < previous) setScrollRevealed(true)
      else if (y > previous) setScrollRevealed(false)
    }

    // One read per frame, however many scroll events the browser fires.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [syncHero])

  /* -- touch detection, menu state, layout shifts --------------------------- */

  useEffect(() => {
    const query = window.matchMedia('(hover: none), (pointer: coarse)')
    const read = () => {
      coarsePointerRef.current = query.matches
    }
    read()
    query.addEventListener('change', read)
    return () => query.removeEventListener('change', read)
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    // The pill nav toggles `data-open` for the mobile sheet and `data-panel-open`
    // for a desktop/tablet mega menu; the header must stay put while either is open.
    const read = () => {
      setMenuOpen(Boolean(header.querySelector('.pn-track[data-open="true"]')))
      setPanelOpen(Boolean(header.querySelector('.pn-track[data-panel-open="true"]')))
    }
    read()

    const observer = new MutationObserver(read)
    observer.observe(header, {
      attributes: true,
      attributeFilter: ['data-open', 'data-panel-open'],
      subtree: true,
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // First paint of a page (and of every new route): forget the previous reveal state and
    // measure the opening band. A frame is cheap and guarantees the DOM is laid out.
    const frame = requestAnimationFrame(() => {
      setScrollRevealed(false)
      measureHideDistance()
      syncHero()
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, measureHideDistance, syncHero])

  useEffect(() => {
    const onLayoutShift = () => {
      // Fonts and images settle after hydration and can change the opening band.
      measureHideDistance()
      syncHero()
    }

    window.addEventListener('resize', onLayoutShift)
    window.addEventListener('load', onLayoutShift)
    document.fonts?.ready.then(onLayoutShift).catch(() => {})

    return () => {
      window.removeEventListener('resize', onLayoutShift)
      window.removeEventListener('load', onLayoutShift)
    }
  }, [measureHideDistance, syncHero])

  /* -- keyboard focus inside the header ------------------------------------ */

  const onFocus = () => setFocused(true)

  const onBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null
    if (!next || !headerRef.current?.contains(next)) setFocused(false)
  }

  /* -- animation ----------------------------------------------------------- */

  // Reduced motion gets a plain fade instead of a slide. Both branches specify
  // the same initial styles so server and client markup agree for that preference.
  const animate = reduceMotion
    ? {
        y: 0,
        opacity: hidden ? 0 : 1,
        transition: { duration: 0.2, ease: 'easeOut' as const },
      }
    : {
        y: hidden ? -hideDistance : 0,
        opacity: 1,
        transition: hidden ? { duration: 0.34, ease: EASE_IN } : { duration: 0.42, ease: EASE_OUT },
      }

  return (
    <motion.header
      ref={headerRef}
      className="hg-header"
      data-hidden={hidden ? 'true' : undefined}
      data-in-hero={inHero ? 'true' : undefined}
      data-menu-open={menuOpen ? 'true' : undefined}
      initial={false}
      animate={animate}
      // Off-screen and out of the tab order — focus inside would otherwise scroll
      // the page back to the top to reach an element that is only visually hidden.
      inert={hidden}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {children}
    </motion.header>
  )
}
