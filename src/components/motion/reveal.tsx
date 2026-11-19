'use client'

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

type RevealProps = {
  children: ReactNode
  className?: string
  /** Stagger in milliseconds — gives lists and grids that "one after another" feel. */
  delay?: number
  /** Distance travelled, in pixels. */
  distance?: number
  as?: ElementType
  /** Play once (default) or replay every time it re-enters the viewport. */
  once?: boolean
}

/**
 * Should this element be hidden and animated in on scroll?
 *
 * Only content that starts *entirely* below the fold qualifies. An element whose top edge is
 * already inside the viewport — including one taller than the viewport, like the Essential
 * Information block with all of its accordions open — is left visible, because hiding it is
 * what made sections appear empty on first view.
 */
export function shouldAnimateOnMount(top: number, viewportHeight: number): boolean {
  if (!Number.isFinite(top) || !Number.isFinite(viewportHeight)) return false
  return top >= viewportHeight
}

/**
 * Scroll-reveal wrapper.
 *
 * TRADE-OFF: this is ~1KB of JavaScript using IntersectionObserver + CSS transitions, instead
 * of importing an animation library. `motion` and `gsap` are both installed and available for
 * bespoke sequences, but for "fade up on scroll" — which is 95% of a content site's motion —
 * the browser's own compositor is smoother and costs nothing on the critical path.
 *
 * CONTENT IS NEVER HIDDEN IN THE MARKUP. The element renders fully visible on the server and on
 * the first client render, which keeps hydration byte-identical and means every section is
 * readable even if the observer, the bundle or the browser fails. Only after mount — and only for
 * an element that starts *entirely* below the fold — does it arm the animation, so a visitor can
 * never see a gap in the page they are already looking at.
 *
 * The observation uses `threshold: 0`: any part of the element reaching the viewport reveals it.
 * A ratio threshold (the old `0.12`) is unreachable for a section taller than ~8 viewports, which
 * is exactly what the open Essential Information and Hotels Near Destination accordions on a trip
 * page become on a laptop or a phone — the section then stayed at `opacity: 0` until reloaded.
 *
 * It also fully respects `prefers-reduced-motion`: the element simply renders visible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 18,
  as: Component = 'div',
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)

  /**
   * `hidden` starts `false` on both the server and the client, so the first paint always shows
   * the content and hydration never has to patch a style the server did not render.
   */
  const [hidden, setHidden] = useState(false)
  /** Set once the element has been hidden because it starts below the fold. */
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // No observer (very old browser, test environment) or motion not wanted: leave it visible.
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // The page is already scrolled (a reload restored the position, or the visitor moved before
    // hydration finished): never take content away from someone who is mid-page.
    if (window.scrollY > 0) return

    // Anything already inside the viewport — including a section taller than the viewport, whose
    // top edge is on screen — stays visible. Only genuinely off-screen content animates in.
    if (!shouldAnimateOnMount(element.getBoundingClientRect().top, window.innerHeight)) return

    setHidden(true)
    setArmed(true)
  }, [])

  useEffect(() => {
    if (!armed) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHidden(false)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setHidden(true)
          }
        }
      },
      // `threshold: 0` — reveal on the first pixel of overlap. See the note above for why a
      // ratio threshold silently skipped tall sections.
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [armed, once])

  return (
    <Component
      ref={ref}
      className={cn(
        'transition-[opacity,transform]',
        // Only promote while it is actually being animated — 75 permanently composited layers
        // is a lot of GPU memory on a phone.
        hidden && 'will-change-[opacity,transform]',
        className,
      )}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translate3d(0,${distance}px,0)` : 'translate3d(0,0,0)',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  )
}
