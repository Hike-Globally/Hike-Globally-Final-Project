'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import './pill-nav.css'

export type PillNavLink = {
  href: string
  label: string
  newTab: boolean
  children?: PillNavLink[]
}

type PillNavProps = {
  logoLabel: string
  logoHref: string
  links: PillNavLink[]
  cta: PillNavLink | null
}

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

function NavCaret() {
  return (
    <svg
      className="pn-caret"
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="currentColor"
        strokeOpacity="0.56"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Pill dropdown nav — interaction port of Header-Sample.html.
 *
 * Desktop: a highlight pill rests on the tab matching the current route and
 * glides to whichever tab is hovered (spring), the tab's dropdown panel fades
 * /slides in below the track; leaving the track returns the pill to the
 * active tab and closes the panel.
 * Mobile (<810px): the track collapses to a 56×56 burger and opens into a
 * full-screen menu. Submenus expand independently of their parent links.
 */
export function PillNav({ logoLabel, logoHref, links, cta }: PillNavProps) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  const viewportRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const linksRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  const [hovered, setHovered] = useState<number | null>(null)
  const [pill, setPill] = useState<{ left: number; width: number; visible: boolean }>({
    left: 0,
    width: 0,
    visible: false,
  })
  const [panelLeft, setPanelLeft] = useState(0)

  /* The mobile sheet is keyed to the pathname it was opened on, so navigating
     closes it without any effect-time state resets. */
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<{ path: string; index: number } | null>(null)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 809.98px)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 809.98px)')
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
      if (!event.matches) {
        setOpenedOn(null)
        setExpanded(null)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const mobileOpen = isMobile && openedOn === pathname
  const mobileExpanded = expanded?.path === pathname ? expanded.index : null

  const closeMobileMenu = useCallback((restoreFocus = false) => {
    setOpenedOn(null)
    setExpanded(null)
    if (restoreFocus) burgerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onHistoryNavigation = () => closeMobileMenu()
    window.addEventListener('popstate', onHistoryNavigation)
    return () => window.removeEventListener('popstate', onHistoryNavigation)
  }, [closeMobileMenu])

  useEffect(() => {
    if (!mobileOpen) return

    // Keep the page behind the full-screen menu still. Lenis intercepts wheel
    // events separately, so stop it too; the menu opts out for its own scroll.
    const html = document.documentElement
    const body = document.body
    const htmlOverflow = html.style.overflow
    const bodyOverflow = body.style.overflow
    const lenis = window.__lenis
    const resumeLenis = lenis && !lenis.isStopped
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (resumeLenis) lenis.stop()

    burgerRef.current?.focus({ preventScroll: true })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMobileMenu(true)
        return
      }
      if (event.key !== 'Tab' || !viewportRef.current) return

      // The overlay is modal: keep keyboard focus inside it, including the logo
      // and any open submenu, until the visitor closes it or chooses a link.
      const focusable = Array.from(
        viewportRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !focusable.includes(active as HTMLElement))) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (active === last || !focusable.includes(active as HTMLElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      html.style.overflow = htmlOverflow
      body.style.overflow = bodyOverflow
      if (resumeLenis) lenis.start()
    }
  }, [mobileOpen, closeMobileMenu])

  const activeIndex = links.findIndex((link) => isActive(pathname, link.href))

  const measure = useCallback(() => {
    const row = linksRef.current
    if (!row) return
    const index = hovered ?? activeIndex
    if (index < 0) {
      setPill((prev) => ({ ...prev, visible: false }))
      return
    }
    const tab = tabRefs.current[index]
    if (!tab) return
    setPill({ left: tab.offsetLeft, width: tab.offsetWidth, visible: true })

    // Panel sits under the pill, clamped inside the track width.
    const panel = panelRef.current
    const panelWidth = panel?.offsetWidth ?? 220
    const maxLeft = Math.max(0, row.offsetWidth - panelWidth - 4)
    setPanelLeft(Math.min(tab.offsetLeft, maxLeft))
  }, [hovered, activeIndex])

  useLayoutEffect(() => {
    // Measuring reads DOM geometry; the state write happens off the effect
    // body (next frame) so the pill also picks up font-swap layout shifts.
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [measure, isMobile, mobileOpen])

  useEffect(() => {
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  const spring = reduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.9 }

  const openPanel = hovered !== null ? (links[hovered]?.children?.length ? hovered : null) : null

  const linkProps = (link: PillNavLink) =>
    link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <div
      ref={viewportRef}
      className="pn-viewport"
      data-open={mobileOpen}
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen ? true : undefined}
      aria-label={mobileOpen ? 'Main menu' : undefined}
    >
      <Link
        href={logoHref}
        className="pn-mobile-logo"
        aria-label={logoLabel}
        onClick={() => {
          if (mobileOpen) closeMobileMenu(true)
        }}
      >
        <Image
          src="/images/logo.svg"
          alt=""
          width={1297}
          height={1212}
          unoptimized
          className="pn-mobile-logo-mark"
        />
      </Link>

      <nav
        className="pn-track"
        data-open={mobileOpen}
        data-lenis-prevent={mobileOpen ? true : undefined}
        aria-label="Main"
      >
        <button
          ref={burgerRef}
          type="button"
          className="pn-burger"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            if (mobileOpen) closeMobileMenu()
            else {
              setOpenedOn(pathname)
              setExpanded(null)
            }
          }}
        >
          <motion.span
            className="pn-burger-bar"
            animate={mobileOpen ? { rotate: 45, y: 3 } : { rotate: 0, y: 0 }}
            transition={spring}
          />
          <motion.span
            className="pn-burger-bar"
            animate={mobileOpen ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }}
            transition={spring}
          />
        </button>

        <Link href={logoHref} className="pn-logo" aria-label={logoLabel}>
          <Image
            src="/images/logo.svg"
            alt=""
            width={1297}
            height={1212}
            unoptimized
            className="pn-logo-mark"
          />
        </Link>

        <div className="pn-links" ref={linksRef} onMouseLeave={() => setHovered(null)}>
          <motion.div
            className="pn-pill"
            animate={{
              left: pill.left,
              width: pill.width,
              opacity: pill.visible ? 1 : 0,
            }}
            transition={spring}
            aria-hidden="true"
          />

          {links.map((link, index) => {
            const children = link.children ?? []
            const hasPanel = children.length > 0
            const expanded = isMobile ? mobileExpanded === index : openPanel === index

            return (
              <div
                key={`${link.href}-${link.label}`}
                className="pn-item"
                data-has-children={hasPanel}
              >
                <Link
                  href={link.href}
                  {...linkProps(link)}
                  ref={(el) => {
                    tabRefs.current[index] = el
                  }}
                  className="pn-tab"
                  data-active={isActive(pathname, link.href)}
                  aria-expanded={hasPanel && !mobileOpen ? expanded : undefined}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onClick={() => {
                    if (mobileOpen) closeMobileMenu(true)
                  }}
                >
                  <span className="pn-label">{link.label}</span>
                  {hasPanel ? <NavCaret /> : null}
                </Link>

                {hasPanel ? (
                  <button
                    type="button"
                    className="pn-expand"
                    aria-label={`${mobileExpanded === index ? 'Collapse' : 'Expand'} ${link.label} submenu`}
                    aria-expanded={mobileExpanded === index}
                    aria-controls={
                      mobileExpanded === index ? `pn-mobile-panel-${index}` : undefined
                    }
                    onClick={() => {
                      setExpanded((current) =>
                        current?.path === pathname && current.index === index
                          ? null
                          : { path: pathname, index },
                      )
                    }}
                  >
                    <NavCaret />
                  </button>
                ) : null}

                {isMobile && hasPanel ? (
                  <AnimatePresence initial={false}>
                    {mobileExpanded === index ? (
                      <motion.div
                        id={`pn-mobile-panel-${index}`}
                        className="pn-panel"
                        initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={spring}
                        style={{ overflow: 'hidden' }}
                      >
                        {children.map((child) => (
                          <Link
                            key={`${child.href}-${child.label}`}
                            href={child.href}
                            {...linkProps(child)}
                            className="pn-panel-item"
                            onClick={() => closeMobileMenu(true)}
                          >
                            <span className="pn-label">{child.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                ) : null}
              </div>
            )
          })}

          {/* Desktop dropdown panel — one floating card under the track. */}
          {!isMobile ? (
            <AnimatePresence>
              {openPanel !== null ? (
                <motion.div
                  ref={panelRef}
                  className="pn-panel"
                  initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1, left: panelLeft }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.99 }}
                  transition={spring}
                  onMouseEnter={() => setHovered(openPanel)}
                >
                  {(links[openPanel].children ?? []).map((child) => (
                    <Link
                      key={`${child.href}-${child.label}`}
                      href={child.href}
                      {...linkProps(child)}
                      className="pn-panel-item"
                    >
                      <span className="pn-label">{child.label}</span>
                    </Link>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          ) : null}
        </div>

        {cta ? (
          <Link href={cta.href} {...linkProps(cta)} className="pn-cta pn-cta-desktop">
            {cta.label}
          </Link>
        ) : null}

        {mobileOpen && cta ? (
          <Link
            href={cta.href}
            {...linkProps(cta)}
            className="pn-cta"
            onClick={() => closeMobileMenu(true)}
          >
            {cta.label}
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
