'use client'

import { Hamburger, Link, useNav } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import AdminNavSignOut from './nav-sign-out'
import { RailIcon, type RailIconName } from './rail-icons'

/**
 * The workspace rail.
 *
 * Payload lays the admin out with a CSS grid (`--nav-width` + content column), and that grid is
 * driven by the classes on the `<aside class="nav">` element this component renders — `.nav--nav-open`
 * opens the column, `.nav--nav-hydrated` reveals it, and the `nav__scroll` node receives the ref the
 * nav context uses. Everything inside is ours, so the rail can own its own structure, spacing and
 * interaction instead of fighting the default markup with selectors.
 *
 * The rail is [brand] / [scrolling body] / [pinned account footer], exactly like the layout a team
 * spends its day in: identity at the top, a filterable list of every collection in the middle, and
 * the account you are signed in as — with a sign-out that works — within reach at the bottom.
 */

export type AdminNavItem = {
  /** `collections:trips` / `globals:settings` / `dashboard` — stable, used as the React key. */
  id: string
  href: string
  icon: RailIconName
  label: string
  /**
   * Match the path exactly instead of as a prefix. The dashboard lives at the admin root, so a
   * prefix match would keep it lit on every page underneath it.
   */
  exact?: boolean
}

export type AdminNavSection = {
  id: string
  items: AdminNavItem[]
  /** Omitted for the first block (the dashboard), which needs no heading. */
  label?: string
}

export type AdminNavAccount = {
  email?: string
  name?: string
  roles?: string[]
}

type RailProps = {
  account?: AdminNavAccount | null
  accountHref: string
  dashboardHref: string
  liveSiteHref: string
  sections: AdminNavSection[]
}

/** Remembers an explicit collapse so a reload does not undo it. */
const COLLAPSE_KEY = 'hg-rail:collapsed'

/** Below this width the rail is an overlay drawer, so it is never opened automatically. */
const RAIL_COLUMN_MIN_WIDTH = 1281

const subscribeToNothing = () => () => {}

const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /mac|iphone|ipad|ipod/i.test(navigator.userAgent)

const isItemActive = (pathname: string, item: AdminNavItem): boolean => {
  if (pathname === item.href) return true
  if (item.exact) return false
  return pathname.startsWith(`${item.href}/`)
}

const initialsOf = (account: AdminNavAccount | null | undefined): string => {
  const name = typeof account?.name === 'string' ? account.name.trim() : ''
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('')
  }
  return account?.email?.[0]?.toUpperCase() ?? '?'
}

export default function AdminNavRail({
  account,
  accountHref,
  dashboardHref,
  liveSiteHref,
  sections,
}: RailProps) {
  const { hydrated, navOpen, navRef, setNavOpen, shouldAnimate } = useNav()
  const pathname = usePathname() ?? dashboardHref

  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const autoOpenAttempted = useRef(false)

  /**
   * Payload treats the rail as a persistent column only above 1440px and as an overlay drawer
   * below it — so a 1280 or 1440 laptop would hide the navigation behind a hamburger. The
   * stylesheet widens that band (see `custom.scss`); this brings the state in line with it,
   * opening the rail once after mount on any desktop width, unless the user has collapsed it
   * here before.
   */
  useEffect(() => {
    if (autoOpenAttempted.current) return
    autoOpenAttempted.current = true
    if (window.innerWidth < RAIL_COLUMN_MIN_WIDTH) return
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === '1') return
    } catch {
      // Private mode / storage disabled: fall through and open as normal.
    }
    setNavOpen(true)
  }, [setNavOpen])

  /** Opening the rail by any route retires a previous "keep it closed" choice. */
  useEffect(() => {
    if (!navOpen) return
    try {
      window.localStorage.removeItem(COLLAPSE_KEY)
    } catch {
      // Ignore storage failures; the preference is a nicety, not a requirement.
    }
  }, [navOpen])

  const collapseRail = useCallback(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, '1')
    } catch {
      // Ignore storage failures; the rail still collapses for this session.
    }
    setNavOpen(false)
  }, [setNavOpen])

  // Platform-correct shortcut hint. `useSyncExternalStore` keeps this hydration-safe: the server
  // snapshot renders the Mac glyph, then the client re-renders with the real answer after mount.
  const isApple = useSyncExternalStore(
    subscribeToNothing,
    isApplePlatform,
    () => true,
  )
  const shortcut = isApple ? '\u2318K' : 'Ctrl K'

  const focusSearch = useCallback(() => {
    searchRef.current?.focus()
    searchRef.current?.select()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
      if (!isShortcut) return
      event.preventDefault()
      if (!navOpen) setNavOpen(true)
      window.setTimeout(focusSearch, 0)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusSearch, navOpen, setNavOpen])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return sections
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.label.toLowerCase().includes(needle)),
      }))
      .filter((section) => section.items.length > 0)
  }, [query, sections])

  const matchCount = filtered.reduce((total, section) => total + section.items.length, 0)
  const role = account?.roles?.[0]

  const className = ['nav', navOpen && 'nav--nav-open', shouldAnimate && 'nav--nav-animate', hydrated && 'nav--nav-hydrated']
    .filter(Boolean)
    .join(' ')

  return (
    <aside className={className} inert={!navOpen ? true : undefined}>
      <div className="nav__scroll" ref={navRef}>
        <div className="nav__header">
          <div className="nav__header-content">
            <button
              aria-label="Close the navigation"
              className="nav__mobile-close"
              onClick={() => setNavOpen(false)}
              tabIndex={navOpen ? undefined : -1}
              type="button"
            >
              <Hamburger closeIcon="collapse" isActive />
            </button>
          </div>
        </div>

        <div className="hg-rail">
          <header className="hg-rail__brand">
            <Link className="hg-rail__identity" href={dashboardHref} prefetch={false}>
              <span aria-hidden="true" className="hg-rail__mark">
                <RailIcon name="trips" />
              </span>
              <span className="hg-rail__wordmark">
                <span className="hg-rail__name">Hike Globally</span>
                <span className="hg-rail__descriptor">Content workspace</span>
              </span>
            </Link>

            <div className="hg-rail__brand-actions">
              <a
                aria-label="Open the live site in a new tab"
                className="hg-rail__ghost"
                href={liveSiteHref}
                rel="noreferrer"
                target="_blank"
                title="Open the live site"
              >
                <RailIcon name="external" />
              </a>
              <button
                aria-label="Collapse the navigation"
                className="hg-rail__ghost hg-rail__ghost--collapse"
                onClick={collapseRail}
                title="Collapse the navigation"
                type="button"
              >
                <RailIcon name="collapse" />
              </button>
            </div>
          </header>

          <div className="hg-rail__body">
            <div className="hg-rail__search">
              <RailIcon className="hg-rail__search-icon" name="search" />
              <input
                aria-label="Filter the workspace navigation"
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setQuery('')
                }}
                placeholder="Jump to…"
                ref={searchRef}
                spellCheck={false}
                type="search"
                value={query}
              />
              {query ? (
                <button
                  aria-label="Clear the filter"
                  className="hg-rail__search-clear"
                  onClick={() => {
                    setQuery('')
                    focusSearch()
                  }}
                  type="button"
                >
                  <RailIcon name="x" />
                </button>
              ) : (
                <kbd aria-hidden="true" className="hg-rail__kbd">
                  {shortcut}
                </kbd>
              )}
            </div>

            <nav aria-label="Workspace navigation" className="hg-rail__sections">
              {filtered.map((section) => (
                <section className="hg-rail__section" key={section.id}>
                  {section.label ? (
                    <div className="hg-rail__section-head">
                      <span className="hg-rail__section-label">{section.label}</span>
                    </div>
                  ) : null}

                  <ul className="hg-rail__items">
                    {section.items.map((item) => {
                      const active = isItemActive(pathname, item)
                      return (
                        <li key={item.id}>
                          <Link
                            aria-current={active ? 'page' : undefined}
                            className={['hg-rail__item', active && 'hg-rail__item--active']
                              .filter(Boolean)
                              .join(' ')}
                            href={item.href}
                            id={`nav-${item.id.replace(/:/g, '-')}`}
                            prefetch={false}
                          >
                            <span className="hg-rail__item-icon">
                              <RailIcon name={item.icon} />
                            </span>
                            <span className="hg-rail__item-label">{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}

              {matchCount === 0 ? (
                <p className="hg-rail__empty">
                  No collections match “<strong>{query}</strong>”.
                </p>
              ) : null}
            </nav>
          </div>

          <footer className="hg-rail__footer">
            <Link
              aria-current={pathname === accountHref ? 'page' : undefined}
              className={['hg-rail__account', pathname === accountHref && 'hg-rail__account--active']
                .filter(Boolean)
                .join(' ')}
              href={accountHref}
              prefetch={false}
            >
              <span aria-hidden="true" className="hg-rail__avatar">
                {initialsOf(account)}
              </span>
              <span className="hg-rail__account-copy">
                <span className="hg-rail__account-name">
                  {account?.name || account?.email || 'Your account'}
                </span>
                <span className="hg-rail__account-meta">
                  {role ? <span className="hg-rail__role">{role}</span> : null}
                  {account?.name && account?.email ? (
                    <span className="hg-rail__account-email">{account.email}</span>
                  ) : null}
                </span>
              </span>
              <RailIcon className="hg-rail__account-cue" name="chevron-right" />
            </Link>

            <AdminNavSignOut />
          </footer>
        </div>
      </div>
    </aside>
  )
}
