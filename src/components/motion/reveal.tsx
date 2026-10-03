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
 * Scroll-reveal wrapper.
 *
 * TRADE-OFF: this is ~1KB of JavaScript using IntersectionObserver + CSS transitions, instead
 * of importing an animation library. `motion` and `gsap` are both installed and available for
 * bespoke sequences, but for "fade up on scroll" — which is 95% of a content site's motion —
 * the browser's own compositor is smoother and costs nothing on the critical path.
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

  // Rendered visible straight away when motion is not wanted (or observers are unavailable),
  // so nothing depends on an effect firing for content to appear.
  const [visible, setVisible] = useState(
    () =>
      typeof IntersectionObserver === 'undefined' ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches),
  )

  useEffect(() => {
    if (visible) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [once, visible])

  return (
    <Component
      ref={ref}
      className={cn('transition-[opacity,transform] will-change-[opacity,transform]', className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0,0,0)' : `translate3d(0,${distance}px,0)`,
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Component>
  )
}
