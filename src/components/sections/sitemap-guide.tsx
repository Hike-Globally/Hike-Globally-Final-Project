'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Search, X } from 'lucide-react'

/**
 * The interactive half of the chart: a live filter across every layer, a scroll-spy index and the
 * rows themselves. All content arrives as props from the server — the component only chooses
 * what to show.
 */

export type SitemapRow = {
  title: string
  href: string
  path: string
  description: string
  /** Short right-hand label: a count ("12 published"), a format ("XML") or nothing. */
  meta?: string
}

export type SitemapLayer = {
  id: string
  kicker: string
  title: string
  note: string
  /** Shown under the header when this layer has no rows (e.g. a CMS layer with no published pages). */
  emptyNote?: string
  rows: SitemapRow[]
}

const pad = (value: number) => String(value).padStart(2, '0')

export function SitemapGuide({ layers }: { layers: SitemapLayer[] }) {
  const [query, setQuery] = useState('')
  const [activeLayer, setActiveLayer] = useState(layers[0]?.id ?? '')
  const layerRefs = useRef<Map<string, HTMLElement>>(new Map())

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

  const totalRows = layers.reduce((sum, layer) => sum + layer.rows.length, 0)
  const visibleRows = visible.reduce((sum, layer) => sum + layer.rows.length, 0)

  /* Row numbers are stable across the filter — they are positions on the chart, not a ranking. */
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

  /* Scroll-spy over the layer sections: whatever is in the middle band is "active". */
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

  const setLayerRef = (id: string) => (node: HTMLElement | null) => {
    if (node) layerRefs.current.set(id, node)
    else layerRefs.current.delete(id)
  }

  return (
    <div className="sitemap-body container-content">
      <aside className="sitemap-sidebar" aria-label="Chart index">
        <label className="sitemap-sidebar__label" htmlFor="sitemap-filter">
          Find a trail
        </label>
        <div className="sitemap-filter">
          <Search size={16} aria-hidden className="sitemap-filter__icon" />
          <input
            id="sitemap-filter"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Khumbu” or “waterfall”"
            className="sitemap-filter__input"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {isFiltering ? (
            <button
              type="button"
              className="sitemap-filter__clear"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>
        <p className="sitemap-filter__count" role="status" aria-live="polite">
          {isFiltering ? `${visibleRows} of ${totalRows} trails` : `${totalRows} trails charted`}
        </p>

        <nav aria-label="Chart layers" className="sitemap-sidebar__layers">
          <ul>
            {layers.map((layer) => (
              <li key={layer.id}>
                <a
                  href={`#${layer.id}`}
                  className="sitemap-layer-link"
                  aria-current={activeLayer === layer.id ? 'true' : undefined}
                  onClick={() => setActiveLayer(layer.id)}
                >
                  <span className="sitemap-layer-link__index" aria-hidden>
                    {layer.kicker}
                  </span>
                  <span className="sitemap-layer-link__title">{layer.title}</span>
                  <span className="sitemap-layer-link__count" aria-hidden>
                    {layer.rows.length}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <p className="sitemap-sidebar__note">
          Every URL above also appears in{' '}
          <a href="/sitemap.xml" className="sitemap-sidebar__notelink">
            /sitemap.xml
          </a>
          .
        </p>
      </aside>

      <div className="sitemap-main">
        {visible.map((layer) => (
          <section
            key={layer.id}
            id={layer.id}
            ref={setLayerRef(layer.id)}
            className="sitemap-layer"
            aria-labelledby={`${layer.id}-heading`}
          >
            <header className="sitemap-layer__head">
              <p className="sitemap-layer__kicker">
                <span aria-hidden>{layer.kicker}</span>
              </p>
              <h2 id={`${layer.id}-heading`} className="sitemap-layer__title heading-xl">
                {layer.title}
              </h2>
              <p className="sitemap-layer__note">{layer.note}</p>
            </header>

            <ol className="sitemap-rows">
              {layer.rows.map((row) => {
                const number = numberFor.get(`${layer.id}:${row.href}:${row.path}`) ?? 0
                return (
                  <li key={row.href + row.path}>
                    <Link href={row.href} className="sitemap-row">
                      <span className="sitemap-row__tick" aria-hidden />
                      <span className="sitemap-row__index" aria-hidden>
                        {pad(number)}
                      </span>
                      <span className="sitemap-row__body">
                        <span className="sitemap-row__title">{row.title}</span>
                        <span className="sitemap-row__desc">{row.description}</span>
                        <span className="sitemap-row__meta">
                          <span className="sitemap-row__path">{row.path}</span>
                          {row.meta ? (
                            <span className="sitemap-row__chip">{row.meta}</span>
                          ) : null}
                        </span>
                      </span>
                      <ArrowUpRight size={18} aria-hidden className="sitemap-row__arrow" />
                    </Link>
                  </li>
                )
              })}
            </ol>

            {layer.rows.length === 0 ? (
              <p className="sitemap-layer__empty">{layer.emptyNote ?? layer.note}</p>
            ) : null}
          </section>
        ))}

        {visible.length === 0 ? (
          <div className="sitemap-empty" role="status">
            <p className="sitemap-empty__kicker">Off the chart</p>
            <h2 className="sitemap-empty__title">No passage matches.</h2>
            <p className="sitemap-empty__text">
              Try a shorter word — or start from the layers above. The whole map is a click away.
            </p>
            <button type="button" className="sitemap-empty__reset" onClick={() => setQuery('')}>
              Reset the chart
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
