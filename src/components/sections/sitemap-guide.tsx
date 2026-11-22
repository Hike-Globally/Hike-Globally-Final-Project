'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Compass,
  Copy,
  Mountain,
  NotebookPen,
  Search,
  Tent,
  X,
  Flag,
} from 'lucide-react'

import Image from '@/components/ui/next-image'

/**
 * The interactive half of the route map. The server hands over the four camps
 * (already ordered, already numbered, each waypoint carrying its altitude); this
 * component runs the live filter, the scroll-spy "you are here" and the little GPS
 * altimeter in the rail. Each camp renders in its own idiom — trailhead cards,
 * photographic benches, a surveyor's ledger, dark register plates — so the page
 * reads as a journey, not a list.
 */

export type SitemapRow = {
  title: string
  href: string
  path: string
  description: string
  /** Short right-hand label: a count ("12 published"), a format ("XML") or nothing. */
  meta?: string
  /** Waypoint altitude in metres — drives the hero profile and the rail altimeter. */
  elevation: number
  /** Bench tiles (the nine landscapes) render their photograph. */
  image?: { src: string; alt: string }
}

export type SitemapLayerKind = 'trailheads' | 'benches' | 'ledger' | 'register'

export type SitemapLayer = {
  id: string
  kicker: string
  title: string
  note: string
  /** Shown under the header when this layer has no rows (e.g. a CMS layer with no published pages). */
  emptyNote?: string
  kind: SitemapLayerKind
  rows: SitemapRow[]
}

const pad = (value: number) => String(value).padStart(2, '0')
const formatElevation = (value: number) => value.toLocaleString('en-US')

const CAMP_ICONS: Record<SitemapLayerKind, typeof Tent> = {
  trailheads: Tent,
  benches: Mountain,
  ledger: NotebookPen,
  register: Flag,
}

/* -------------------------------------------------------------------------- */
/* The register's copy button — absolute URL, because the register is what an  */
/* agent or reader will actually paste somewhere.                              */
/* -------------------------------------------------------------------------- */

function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    const absolute =
      typeof window !== 'undefined' ? new URL(path, window.location.origin).href : path
    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard blocked (permissions/iframe) — the path is printed beside the button. */
    }
  }

  return (
    <button type="button" className="plate__copy" onClick={copy} aria-live="polite">
      {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
      <span>{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}

export function SitemapGuide({ layers }: { layers: SitemapLayer[] }) {
  const [query, setQuery] = useState('')
  const [activeLayer, setActiveLayer] = useState(layers[0]?.id ?? '')
  const [progress, setProgress] = useState(0)
  const layerRefs = useRef<Map<string, HTMLElement>>(new Map())
  const bodyRef = useRef<HTMLDivElement | null>(null)

  const trimmed = query.trim().toLowerCase()
  const isFiltering = trimmed.length > 0

  const visible = useMemo(() => {
    if (!isFiltering) return layers
    return layers
      .map((layer) => ({
        ...layer,
        rows: layer.rows.filter((row) =>
          `${row.title} ${row.description} ${row.path} ${row.meta ?? ''}`
            .toLowerCase()
            .includes(trimmed),
        ),
      }))
      .filter((layer) => layer.rows.length > 0)
  }, [layers, trimmed, isFiltering])

  const allRows = useMemo(() => layers.flatMap((layer) => layer.rows), [layers])
  const totalRows = allRows.length
  const visibleRows = visible.reduce((sum, layer) => sum + layer.rows.length, 0)
  const minElevation = allRows.length ? Math.min(...allRows.map((row) => row.elevation)) : 0
  const maxElevation = allRows.length ? Math.max(...allRows.map((row) => row.elevation)) : 0

  /* Row numbers are stable across the filter — they are positions on the route, not a ranking. */
  const numberFor = useMemo(() => {
    const numbers = new Map<string, number>()
    let next = 1
    for (const layer of layers) {
      for (const row of layer.rows) {
        numbers.set(`${layer.id}:${row.href}:${row.path}`, next)
        next += 1
      }
    }
    return numbers
  }, [layers])

  /* Scroll-spy over the camp sections: whatever is in the middle band is "you are here". */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveLayer(entry.target.id)
        }
      },
      { rootMargin: '-38% 0px -55% 0px', threshold: 0 },
    )
    layerRefs.current.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [layers])

  /* The altimeter: map the scroll position through the route body onto altitude. */
  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    let frame = 0
    const measure = () => {
      frame = 0
      const rect = body.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const span = rect.height + viewport
      const walked = viewport * 0.6 - rect.top
      setProgress(Math.min(1, Math.max(0, walked / span)))
    }
    const onScroll = () => {
      if (frame === 0) frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [])

  const setLayerRef = (id: string) => (node: HTMLElement | null) => {
    if (node) layerRefs.current.set(id, node)
    else layerRefs.current.delete(id)
  }

  const altimeter = Math.round(minElevation + progress * (maxElevation - minElevation))
  const activeWaypoint = Math.min(totalRows, Math.max(1, Math.round(progress * (totalRows - 1)) + 1))
  const activeLayerTitle = layers.find((layer) => layer.id === activeLayer)?.title ?? ''

  const elevationRange = (layer: SitemapLayer) => {
    if (layer.rows.length === 0) return null
    const values = layer.rows.map((row) => row.elevation)
    return `${formatElevation(Math.min(...values))}–${formatElevation(Math.max(...values))} m`
  }

  const renderWaypointCard = (layer: SitemapLayer, row: SitemapRow, index: number, count: number) => {
    const number = numberFor.get(`${layer.id}:${row.href}:${row.path}`) ?? 0
    const wide = count % 2 === 1 && index === count - 1
    return (
      <li key={row.href + row.path} className={wide ? 'waypoints__item waypoints__item--wide' : 'waypoints__item'}>
        <Link href={row.href} className="waypoint">
          <span className="waypoint__ghost" aria-hidden="true">
            {pad(number)}
          </span>
          <span className="waypoint__top">
            <span className="waypoint__code">WP&nbsp;{pad(number)}</span>
            <span className="waypoint__alt">{formatElevation(row.elevation)} m</span>
          </span>
          <span className="waypoint__title">{row.title}</span>
          <span className="waypoint__desc">{row.description}</span>
          <span className="waypoint__foot">
            <span className="waypoint__path">{row.path}</span>
            {row.meta ? <span className="tag">{row.meta}</span> : null}
          </span>
          <ArrowUpRight size={18} aria-hidden className="waypoint__arrow" />
        </Link>
      </li>
    )
  }

  const renderBench = (layer: SitemapLayer, row: SitemapRow, index: number) => {
    const number = index + 1
    return (
      <li key={row.href + row.path} className="benches__item">
        <Link href={row.href} className="bench">
          {row.image ? (
            <Image
              src={row.image.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="bench__image"
              draggable={false}
            />
          ) : null}
          <span className="bench__scrim" aria-hidden="true" />
          <span className="bench__top">
            <span className="bench__code">BENCH&nbsp;{pad(number)}</span>
            <span className="bench__alt">{formatElevation(row.elevation)} m</span>
          </span>
          <span className="bench__bottom">
            <span className="bench__title">{row.title}</span>
            <span className="bench__desc">{row.description}</span>
            <span className="bench__meta">
              <span className="bench__path">{row.path}</span>
              {row.meta ? <span className="bench__chip">{row.meta}</span> : null}
            </span>
          </span>
          <ArrowUpRight size={20} aria-hidden className="bench__arrow" />
        </Link>
      </li>
    )
  }

  const renderLedgerRow = (layer: SitemapLayer, row: SitemapRow, index: number) => (
    <li key={row.href + row.path}>
      <Link href={row.href} className="ledger-row">
        <span className="ledger-row__idx" aria-hidden="true">
          L{pad(index + 1)}
        </span>
        <span className="ledger-row__body">
          <span className="ledger-row__title">{row.title}</span>
          <span className="ledger-row__desc">{row.description}</span>
        </span>
        <span className="ledger-row__meta">
          <span className="ledger-row__path">{row.path}</span>
          <span className="ledger-row__stamp">CMS</span>
        </span>
        <ArrowUpRight size={17} aria-hidden className="ledger-row__arrow" />
      </Link>
    </li>
  )

  const renderPlate = (layer: SitemapLayer, row: SitemapRow) => (
    <li key={row.href + row.path}>
      <div className="plate">
        <Link href={row.href} className="plate__link">
          <span className="plate__top">
            <span className="plate__badge">{row.meta ?? 'FILE'}</span>
            <span className="plate__alt">{formatElevation(row.elevation)} m</span>
          </span>
          <span className="plate__title">{row.title}</span>
          <span className="plate__desc">{row.description}</span>
          <ArrowUpRight size={17} aria-hidden className="plate__arrow" />
        </Link>
        <span className="plate__foot">
          <code className="plate__path">{row.path}</code>
          <CopyLinkButton path={row.path} />
        </span>
      </div>
    </li>
  )

  const renderRows = (layer: SitemapLayer) => {
    switch (layer.kind) {
      case 'trailheads':
        return (
          <ol className="waypoints" aria-label="The circuit, waypoint by waypoint">
            {layer.rows.map((row, index) =>
              renderWaypointCard(layer, row, index, layer.rows.length),
            )}
          </ol>
        )
      case 'benches':
        return (
          <ol className="benches" aria-label="The nine landscapes">
            {layer.rows.map((row, index) => renderBench(layer, row, index))}
          </ol>
        )
      case 'ledger':
        return (
          <div className="ledger">
            <p className="ledger__columns" aria-hidden="true">
              <span>№</span>
              <span>Entry</span>
              <span className="ledger__col-path">Path</span>
              <span className="ledger__col-class">Class</span>
              <span />
            </p>
            <ol className="ledger__rows" aria-label="CMS landing pages">
              {layer.rows.map((row, index) => renderLedgerRow(layer, row, index))}
            </ol>
          </div>
        )
      case 'register':
        return (
          <ol className="register" aria-label="Machine-readable files and fine print">
            {layer.rows.map((row) => renderPlate(layer, row))}
          </ol>
        )
    }
  }

  return (
    <div className="route container-content" ref={bodyRef}>
      {/* ------------------------------------------------------------ The rail */}
      <aside className="route-rail" aria-label="Route profile">
        <div className="route-rail__panel">
          <p className="route-rail__brand">
            <Compass size={15} aria-hidden />
            <span>Route profile</span>
            <span className="route-rail__brand-coord" aria-hidden="true">
              27.9881° N
            </span>
          </p>

          {/* The altimeter — decorative readout of where in the walk you are */}
          <div className="altimeter" aria-hidden="true">
            <p className="altimeter__label">Altimeter</p>
            <p className="altimeter__value">
              {formatElevation(altimeter)}
              <span className="altimeter__unit">m</span>
            </p>
            <p className="altimeter__track">
              <span className="altimeter__fill" style={{ transform: `scaleX(${progress})` }} />
            </p>
            <p className="altimeter__sub">
              <span>{activeLayerTitle}</span>
              <span className="altimeter__wpt">
                WPT {pad(activeWaypoint)}/{pad(totalRows)}
              </span>
            </p>
          </div>

          {/* The camps, in walking order */}
          <nav aria-label="Route camps" className="camps">
            <ul>
              {layers.map((layer, index) => {
                const active = activeLayer === layer.id
                const range = elevationRange(layer)
                return (
                  <li key={layer.id}>
                    <a
                      href={`#${layer.id}`}
                      className="camp"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setActiveLayer(layer.id)}
                    >
                      <span className="camp__dot" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="camp__body">
                        <span className="camp__kicker">{layer.kicker}</span>
                        <span className="camp__title">{layer.title}</span>
                      </span>
                      <span className="camp__alt" aria-hidden="true">
                        {range ?? `${layer.rows.length}×`}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* The filter */}
          <label className="route-rail__label" htmlFor="sitemap-filter">
            Find a waypoint
          </label>
          <div className="route-filter">
            <Search size={15} aria-hidden className="route-filter__icon" />
            <input
              id="sitemap-filter"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “Khumbu” or “RSS”"
              className="route-filter__input"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
            {isFiltering ? (
              <button
                type="button"
                className="route-filter__clear"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={13} aria-hidden />
              </button>
            ) : null}
          </div>
          <p className="route-filter__count" role="status" aria-live="polite">
            {isFiltering ? `${visibleRows} of ${totalRows} waypoints` : `${totalRows} waypoints charted`}
          </p>

          <p className="route-rail__note">
            The whole walk is machine-readable too — see{' '}
            <a href="/sitemap.xml" className="route-rail__notelink">
              /sitemap.xml
            </a>
            .
          </p>
        </div>
      </aside>

      {/* -------------------------------------------------------------- Main */}
      <div className="route-main">
        {visible.map((layer) => {
          const range = elevationRange(layer)
          const Icon = CAMP_ICONS[layer.kind]
          return (
            <section
              key={layer.id}
              id={layer.id}
              ref={setLayerRef(layer.id)}
              className="camp-section"
              data-kind={layer.kind}
              aria-labelledby={`${layer.id}-heading`}
            >
              <header className="camp-head">
                <span className="camp-head__seal" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <div className="camp-head__copy">
                  <span className="camp-head__kicker">
                    <span>{layer.kicker}</span>
                    {range ? (
                      <>
                        <span className="camp-head__kicker-sep" aria-hidden="true">
                          ·
                        </span>
                        <span>{range}</span>
                      </>
                    ) : null}
                    <span className="camp-head__kicker-sep" aria-hidden="true">
                      ·
                    </span>
                    <span>
                      {layer.rows.length} waypoint{layer.rows.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <h2 id={`${layer.id}-heading`} className="camp-head__title heading-xl">
                    {layer.title}
                  </h2>
                  <span className="camp-head__note">{layer.note}</span>
                </div>
              </header>

              {layer.rows.length > 0 ? (
                renderRows(layer)
              ) : (
                <p className="camp-section__empty">{layer.emptyNote ?? layer.note}</p>
              )}
            </section>
          )
        })}

        {visible.length === 0 ? (
          <div className="route-empty" role="status">
            <p className="route-empty__kicker">Off the route</p>
            <h2 className="route-empty__title">No waypoint matches.</h2>
            <p className="route-empty__text">
              Try a shorter word — or start from the camps above. The whole route is a click away.
            </p>
            <button type="button" className="route-empty__reset" onClick={() => setQuery('')}>
              Back to the trailhead
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
