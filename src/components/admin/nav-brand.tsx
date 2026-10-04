'use client'

import { useNav } from '@payloadcms/ui'
import Link from 'next/link'
import React from 'react'

/**
 * Brand header for the admin sidebar.
 *
 * Registered as `admin.components.beforeNav`, so Payload renders it at the top of the navigation
 * rail, outside the scrolling link list. That is what lets the rail pin its identity block while
 * collections scroll underneath it.
 *
 * The collapse control lives here rather than in Payload's default floating button, which would
 * otherwise sit on top of this block: while the rail is open the floating button is hidden
 * (see `custom.scss`) and this chevron drives `setNavOpen()`; when the rail is closed the rail —
 * and with it this control — is off-canvas, so Payload's floating button reappears to reopen it.
 */
export default function NavBrand() {
  const { navOpen, setNavOpen } = useNav()

  return (
    <div className="hg-nav-brand">
      <Link className="hg-nav-brand__identity" href="/admin" prefetch={false}>
        <span aria-hidden="true" className="hg-nav-brand__mark">
          <svg fill="none" viewBox="0 0 40 40">
            <path d="M5.5 29.5 16.1 12l5.1 8.1 3.1-4.9 10.2 14.3H5.5Z" />
            <path d="m16.1 12 3 4.8 2.1-3.3 3.1 4.9" />
            <path d="M5.5 33.5h29" />
          </svg>
        </span>
        <span className="hg-nav-brand__wordmark">
          <span className="hg-nav-brand__name">Hike Globally</span>
          <span className="hg-nav-brand__descriptor">Content workspace</span>
        </span>
      </Link>

      <div className="hg-nav-brand__actions">
        <a
          aria-label="Open the live site in a new tab"
          className="hg-nav-brand__action"
          href="/en"
          rel="noreferrer"
          target="_blank"
          title="Open the live site"
        >
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
          </svg>
        </a>

        <button
          aria-expanded={navOpen}
          aria-label="Collapse the navigation rail"
          className="hg-nav-brand__action hg-nav-brand__action--collapse"
          onClick={() => setNavOpen(false)}
          title="Collapse the navigation rail"
          type="button"
        >
          <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
            <path d="m14 7-5 5 5 5" />
            <path d="M19 5v14" />
          </svg>
        </button>
      </div>
    </div>
  )
}
