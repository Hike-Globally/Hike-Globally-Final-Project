'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
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

/** Switzer, self-hosted from node_modules (@carrot-kpi/switzer-font). */
const PN_FONT = "'Switzer', 'Inter Variable', system-ui, sans-serif"

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

/**
 * Pill dropdown nav — interaction port of Header-Sample.html.
 *
 * Desktop: a highlight pill rests on the tab matching the current route and
 * glides to whichever tab is hovered (spring), the tab's dropdown panel fades
 * /slides in below the track; leaving the track returns the pill to the
 * active tab and closes the panel.
 * Mobile (<810px): the track collapses to a 56×56 burger; tapping expands it
 * into a 316px column where each tab accordion-expands its panel.
 */
export function PillNav({ logoLabel, logoHref, links, cta }: PillNavProps) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

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

  const mobileOpen = openedOn === pathname
  const mobileExpanded = expanded?.path === pathname ? expanded.index : null

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
    <div className="pn-viewport" style={{ ['--pn-font' as string]: PN_FONT }}>
      <nav className="pn-track" data-open={mobileOpen} aria-label="Main">
        <button
          type="button"
          className="pn-burger"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            setOpenedOn((current) => (current === pathname ? null : pathname))
            setExpanded(null)
          }}
        >
          <motion.span
            className="pn-burger-bar"
            animate={
              mobileOpen && !reduceMotion
                ? { rotate: 45, y: 4.24 }
                : { rotate: 0, y: 0 }
            }
            transition={spring}
          />
          <motion.span
            className="pn-burger-bar"
            animate={
              mobileOpen && !reduceMotion
                ? { rotate: -45, y: -4.24 }
                : { rotate: 0, y: 0 }
            }
            transition={spring}
          />
        </button>

        <Link href={logoHref} className="pn-logo">
          {logoLabel}
        </Link>

        <div
          className="pn-links"
          ref={linksRef}
          onMouseLeave={() => setHovered(null)}
        >
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
              <div key={`${link.href}-${link.label}`} style={{ display: 'contents' }}>
                <Link
                  href={link.href}
                  {...linkProps(link)}
                  ref={(el) => {
                    tabRefs.current[index] = el
                  }}
                  className="pn-tab"
                  data-active={isActive(pathname, link.href)}
                  aria-expanded={hasPanel ? expanded : undefined}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onClick={() => {
                    if (isMobile && hasPanel) {
                      setExpanded((current) =>
                        current?.path === pathname && current.index === index
                          ? null
                          : { path: pathname, index },
                      )
                    }
                  }}
                >
                  <span className="pn-label">{link.label}</span>
                  {hasPanel ? (
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
                  ) : null}
                </Link>

                {isMobile && hasPanel ? (
                  <AnimatePresence initial={false}>
                    {mobileExpanded === index ? (
                      <motion.div
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

        {isMobile && mobileOpen && cta ? (
          <Link href={cta.href} {...linkProps(cta)} className="pn-cta">
            {cta.label}
          </Link>
        ) : null}
      </nav>
    </div>
  )
}
