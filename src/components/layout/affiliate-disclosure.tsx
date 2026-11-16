'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Info, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

const DISMISSED_KEY = 'hg-affiliate-disclosure-dismissed-v1'
const EXCLUDED_PATHS = new Set([
  '/contact',
  '/contact-us',
  '/about',
  '/about-us',
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-and-conditions',
])

function isExcludedPath(pathname: string) {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  return EXCLUDED_PATHS.has(normalizedPath)
}

export function AffiliateDisclosure() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)

    if (!pathname || isExcludedPath(pathname)) return

    try {
      if (window.sessionStorage.getItem(DISMISSED_KEY) === 'true') return
    } catch {
      // The notice remains usable when storage is unavailable or disabled.
    }

    const timer = window.setTimeout(() => setVisible(true), 900)
    return () => window.clearTimeout(timer)
  }, [pathname])

  function dismiss() {
    setVisible(false)
    try {
      window.sessionStorage.setItem(DISMISSED_KEY, 'true')
    } catch {
      // Dismissal still works for this render if storage is unavailable.
    }
  }

  if (!visible || !pathname || isExcludedPath(pathname)) return null

  return (
    <aside className="affiliate-disclosure" aria-label="Affiliate disclosure" aria-live="polite">
      <div className="affiliate-disclosure__topline">
        <span className="affiliate-disclosure__mark" aria-hidden="true">
          <Info size={16} strokeWidth={1.7} />
        </span>
        <p className="affiliate-disclosure__eyebrow">A note on how we work</p>
        <button
          className="affiliate-disclosure__close"
          type="button"
          onClick={dismiss}
          aria-label="Dismiss affiliate disclosure"
        >
          <X size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <h2 className="affiliate-disclosure__title">A little transparency.</h2>
      <p className="affiliate-disclosure__copy">
        Hike Globally does not directly conduct or operate tours, treks, or expeditions. We connect
        travellers with independent third-party operators. If you book through a link on our
        platform, we may earn a commission.
      </p>

      <div className="affiliate-disclosure__footer">
        <span className="affiliate-disclosure__note">Your journey. Their expertise.</span>
        <Link className="affiliate-disclosure__link" href="/about">
          Our role <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </div>
    </aside>
  )
}
