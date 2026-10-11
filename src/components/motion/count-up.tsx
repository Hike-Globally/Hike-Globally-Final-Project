'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

import { cn } from '@/lib/utils'

/** Decelerating curve that lands softly on the final value. */
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/**
 * Number that counts up to its final value the first time it scrolls into view.
 *
 * WHY NOT A CSS COUNTER: a counter animates on a property change no matter where the element
 * is, so it would be finished before the visitor ever scrolls to it. This starts on the
 * intersection instead — and only once, so the numbers never re-run on the way back up.
 *
 * Progressive enhancement: the *final* value is what renders on the server and in the first
 * client render, so the markup is correct with JavaScript disabled (and hydration has nothing
 * to reconcile). The count-down to zero only happens in an effect, i.e. once the animation is
 * actually possible.
 *
 * `prefers-reduced-motion` is honoured by simply never starting: the value stays as rendered.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1900,
  className,
}: {
  value: number
  /** Decimal places to hold while counting (and to show at rest). */
  decimals?: number
  prefix?: string
  suffix?: string
  /** Milliseconds for the full count. */
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduceMotion = useReducedMotion()
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (!inView || reduceMotion) return

    // The count starts on the first frame (progress 0 → the zero value, then up to the exact
    // final value), so the effect body itself never calls setState.
    let frame = 0
    let start = 0

    const tick = (now: number) => {
      if (!start) start = now
      const progress = Math.min(1, (now - start) / duration)
      setShown(value * easeOutExpo(progress))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [duration, inView, reduceMotion, value])

  const formatted = formatNumber(shown, decimals)

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

/** `1200` → `“1,200”`; `4.9` with one decimal → `“4.9”`. */
function formatNumber(value: number, decimals: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
