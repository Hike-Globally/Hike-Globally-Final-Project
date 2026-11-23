'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  Check,
  Copy,
  GitBranch,
  LayoutGrid,
  List,
  Search,
  X,
} from 'lucide-react'

/**
 * Interactive Visual Sitemap & Information Flow explorer.
 *
 * Inspired by Octopus.do enterprise-grade visual IA maps (Growlith Academy blueprint):
 *  - Subsystem filter bar: All (N) + 6 architectural subsystems with live counts
 *  - Three view modes: Diagram (root-to-branch wireframe tree), Cards (spec cards), Index (table)
 *  - Search / route filter across titles, paths, descriptions, and metadata
 *  - Architectural Taxonomy ("Six Core Subsystems at a Glance") with "Filter this subsystem" triggers
 */

export type SitemapNodeKind = 'root' | 'hub' | 'endpoint' | 'protocol'

export type SitemapNode = {
  title: string
  href: string
  path: string
  description: string
  /** HTTP status code or protocol badge, e.g. '200' */
  status: string
  kind: SitemapNodeKind
  /** Optional supplementary tag (e.g. '14d · challenging', '9 landscapes', 'XML') */
  meta?: string
}

export type SitemapSubsystem = {
  id: string
  /** Numerical badge, e.g. '01' */
  code: string
  /** Taxonomy subtitle, e.g. 'Root & Direction' */
  kicker: string
  /** Display name, e.g. 'Core & Brand' */
  title: string
  /** Concise subsystem summary */
  description: string
  /** Accent variant mapped strictly to Hike Globally tokens */
  accent: 'ink' | 'deep' | 'sage' | 'haze' | 'slate'
  nodes: SitemapNode[]
}

export type SitemapViewMode = 'diagram' | 'cards' | 'index'

function WireframeBars({ kind }: { kind: SitemapNodeKind }) {
  return (
    <span className="ia-wireframe" data-kind={kind} aria-hidden="true">
      <span className="ia-wireframe__bar ia-wireframe__bar--hero" />
      <span className="ia-wireframe__row">
        <span className="ia-wireframe__cell" />
        <span className="ia-wireframe__cell" />
        {kind === 'root' || kind === 'hub' ? <span className="ia-wireframe__cell" /> : null}
      </span>
      <span className="ia-wireframe__bar ia-wireframe__bar--foot" />
    </span>
  )
}

function CopyEndpointButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const url = typeof window !== 'undefined' ? new URL(path, window.location.origin).href : path
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* Clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      className="ia-copy-btn"
      onClick={handleCopy}
      aria-label={`Copy full URL for ${path}`}
      title="Copy full URL"
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

export function SitemapGuide({
  subsystems,
  rootNode,
}: {
  subsystems: SitemapSubsystem[]
  rootNode: SitemapNode
}) {
  const [activeSubsystem, setActiveSubsystem] = useState<string>('all')
  const [viewMode, setViewMode] = useState<SitemapViewMode>('diagram')
  const [query, setQuery] = useState('')
  const explorerRef = useRef<HTMLDivElement | null>(null)

  const trimmed = query.trim().toLowerCase()
  const isSearching = trimmed.length > 0

  const totalCount = useMemo(
    () => subsystems.reduce((sum, sub) => sum + sub.nodes.length, 0),
    [subsystems],
  )

  const filteredSubsystems = useMemo(() => {
    return subsystems
      .filter((sub) => activeSubsystem === 'all' || sub.id === activeSubsystem)
      .map((sub) => {
        if (!isSearching) return sub
        const matchedNodes = sub.nodes.filter((node) =>
          `${node.title} ${node.path} ${node.description} ${node.meta ?? ''} ${sub.title}`
            .toLowerCase()
            .includes(trimmed),
        )
        return { ...sub, nodes: matchedNodes }
      })
      .filter((sub) => sub.nodes.length > 0)
  }, [subsystems, activeSubsystem, isSearching, trimmed])

  const visibleCount = useMemo(
    () => filteredSubsystems.reduce((sum, sub) => sum + sub.nodes.length, 0),
    [filteredSubsystems],
  )

  const focusSubsystem = (id: string) => {
    setActiveSubsystem(id)
    setQuery('')
    if (explorerRef.current) {
      explorerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const resetFilters = () => {
    setActiveSubsystem('all')
    setQuery('')
  }

  /* For Diagram view: separate the root '/' node from Core & Brand's remaining nodes so '/' sits at the apex */
  const diagramBranches = useMemo(() => {
    return filteredSubsystems
      .map((sub) => ({
        ...sub,
        branchNodes:
          activeSubsystem === 'all' && !isSearching && sub.id === 'core'
            ? sub.nodes.filter((node) => node.path !== rootNode.path)
            : sub.nodes,
      }))
      .filter((sub) => sub.branchNodes.length > 0)
  }, [filteredSubsystems, activeSubsystem, isSearching, rootNode.path])

  const showApexRoot = activeSubsystem === 'all' && !isSearching

  return (
    <>
      {/* ====================================================================
          INTERACTIVE ARCHITECTURE WORKSPACE
          ==================================================================== */}
      <section
        ref={explorerRef}
        id="architecture-map"
        className="ia-workspace"
        aria-label="Interactive visual sitemap and route explorer"
      >
        <div className="container-content">
          {/* Toolbar: Subsystem Filter Pills + Search + View Switcher */}
          <div className="ia-toolbar">
            <div className="ia-toolbar__filters" role="group" aria-label="Filter by subsystem">
              <button
                type="button"
                className="ia-filter-pill"
                aria-pressed={activeSubsystem === 'all'}
                onClick={() => setActiveSubsystem('all')}
              >
                <span>All</span>
                <span className="ia-filter-pill__count">({totalCount})</span>
              </button>
              {subsystems.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  className="ia-filter-pill"
                  aria-pressed={activeSubsystem === sub.id}
                  onClick={() => setActiveSubsystem(sub.id)}
                >
                  <span>{sub.title}</span>
                  <span className="ia-filter-pill__count">({sub.nodes.length})</span>
                </button>
              ))}
            </div>

            <div className="ia-toolbar__controls">
              <div className="ia-search">
                <Search size={14} aria-hidden className="ia-search__icon" />
                <label htmlFor="ia-route-search" className="sr-only">
                  Filter routes or titles
                </label>
                <input
                  id="ia-route-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Filter path or node…"
                  className="ia-search__input"
                  autoComplete="off"
                  spellCheck={false}
                />
                {isSearching ? (
                  <button
                    type="button"
                    className="ia-search__clear"
                    onClick={() => setQuery('')}
                    aria-label="Clear route search"
                  >
                    <X size={13} aria-hidden />
                  </button>
                ) : null}
              </div>

              <div className="ia-view-tabs" role="group" aria-label="View mode">
                <button
                  type="button"
                  className="ia-view-tab"
                  aria-pressed={viewMode === 'diagram'}
                  onClick={() => setViewMode('diagram')}
                >
                  <GitBranch size={14} aria-hidden />
                  <span>Diagram</span>
                </button>
                <button
                  type="button"
                  className="ia-view-tab"
                  aria-pressed={viewMode === 'cards'}
                  onClick={() => setViewMode('cards')}
                >
                  <LayoutGrid size={14} aria-hidden />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  className="ia-view-tab"
                  aria-pressed={viewMode === 'index'}
                  onClick={() => setViewMode('index')}
                >
                  <List size={14} aria-hidden />
                  <span>Index</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry status bar */}
          <div className="ia-status-strip" role="status" aria-live="polite">
            <span className="ia-status-strip__summary">
              Showing <strong>{visibleCount}</strong> of <strong>{totalCount}</strong> indexed nodes
              {activeSubsystem !== 'all' ? (
                <>
                  {' '}
                  in{' '}
                  <strong>
                    {subsystems.find((sub) => sub.id === activeSubsystem)?.title}
                  </strong>
                </>
              ) : null}
            </span>
            {activeSubsystem !== 'all' || isSearching ? (
              <button type="button" className="ia-status-strip__reset" onClick={resetFilters}>
                Reset filter
              </button>
            ) : (
              <span className="ia-status-strip__legend" aria-hidden="true">
                <span className="ia-legend-dot ia-legend-dot--hub" /> Hub Root
                <span className="ia-legend-dot ia-legend-dot--endpoint" /> Canonical Endpoint
              </span>
            )}
          </div>

          {/* Empty state */}
          {filteredSubsystems.length === 0 ? (
            <div className="ia-empty" role="status">
              <p className="ia-empty__eyebrow">0 MATCHING NODES</p>
              <h2 className="ia-empty__title">No route matches your filter</h2>
              <p className="ia-empty__copy">
                Try searching by URL segment (for example <code>/trips</code>, <code>/places</code>,
                or <code>/blog</code>) or clear the active subsystem filter.
              </p>
              <button type="button" className="ia-empty__btn" onClick={resetFilters}>
                Show all {totalCount} nodes
              </button>
            </div>
          ) : null}

          {/* ================================================================
              VIEW 1: DIAGRAM (Octopus.do Visual IA Tree Canvas)
              ================================================================ */}
          {filteredSubsystems.length > 0 && viewMode === 'diagram' ? (
            <div className="ia-canvas">
              {showApexRoot ? (
                <div className="ia-apex">
                  <Link href={rootNode.href} className="ia-node ia-node--root">
                    <span className="ia-node__bar" aria-hidden="true" />
                    <span className="ia-node__head">
                      <code className="ia-node__path">{rootNode.path}</code>
                      <span className="ia-node__status">{rootNode.status}</span>
                    </span>
                    <WireframeBars kind="root" />
                    <span className="ia-node__title">{rootNode.title}</span>
                    <span className="ia-node__meta">{rootNode.description}</span>
                  </Link>
                  <div className="ia-apex__stem" aria-hidden="true" />
                </div>
              ) : null}

              <div
                className="ia-tree-grid"
                data-columns={Math.min(6, diagramBranches.length)}
                data-connected={showApexRoot ? 'true' : 'false'}
              >
                {diagramBranches.map((sub) => {
                  const [firstNode, ...childNodes] = sub.branchNodes
                  const hasHubLead = firstNode && firstNode.kind === 'hub'

                  return (
                    <section
                      key={sub.id}
                      className="ia-column"
                      data-accent={sub.accent}
                      aria-labelledby={`diagram-col-${sub.id}`}
                    >
                      <div className="ia-column__connector" aria-hidden="true" />

                      <header className="ia-column__header">
                        <span className="ia-column__code">{sub.code}</span>
                        <h2 id={`diagram-col-${sub.id}`} className="ia-column__title">
                          {sub.title}
                        </h2>
                        <span className="ia-column__count">{sub.branchNodes.length}</span>
                      </header>

                      {hasHubLead ? (
                        <div className="ia-column__hub-wrap">
                          <Link href={firstNode.href} className="ia-node ia-node--hub">
                            <span className="ia-node__bar" aria-hidden="true" />
                            <span className="ia-node__head">
                              <code className="ia-node__path">{firstNode.path}</code>
                              <span className="ia-node__status">{firstNode.status}</span>
                            </span>
                            <WireframeBars kind="hub" />
                            <span className="ia-node__title">{firstNode.title}</span>
                            {firstNode.meta ? (
                              <span className="ia-node__badge">{firstNode.meta}</span>
                            ) : null}
                          </Link>
                        </div>
                      ) : null}

                      {(hasHubLead ? childNodes : sub.branchNodes).length > 0 ? (
                        <ul className="ia-branch-list">
                          {(hasHubLead ? childNodes : sub.branchNodes).map((node) => (
                            <li key={`${sub.id}:${node.path}`} className="ia-branch-list__item">
                              <Link
                                href={node.href}
                                className={`ia-node ia-node--${node.kind}`}
                              >
                                <span className="ia-node__bar" aria-hidden="true" />
                                <span className="ia-node__head">
                                  <code className="ia-node__path">{node.path}</code>
                                  <span className="ia-node__status">{node.status}</span>
                                </span>
                                <span className="ia-node__title">{node.title}</span>
                                {node.meta ? (
                                  <span className="ia-node__badge">{node.meta}</span>
                                ) : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* ================================================================
              VIEW 2: CARDS (Route Specification Cards by Subsystem)
              ================================================================ */}
          {filteredSubsystems.length > 0 && viewMode === 'cards' ? (
            <div className="ia-cards-view">
              {filteredSubsystems.map((sub) => (
                <section
                  key={sub.id}
                  className="ia-cards-group"
                  data-accent={sub.accent}
                  aria-labelledby={`cards-group-${sub.id}`}
                >
                  <header className="ia-cards-group__head">
                    <div className="ia-cards-group__title-row">
                      <span className="ia-cards-group__code">
                        {sub.code} / {sub.kicker}
                      </span>
                      <h2 id={`cards-group-${sub.id}`} className="ia-cards-group__title">
                        {sub.title}
                      </h2>
                    </div>
                    <span className="ia-cards-group__count">
                      {sub.nodes.length} {sub.nodes.length === 1 ? 'node' : 'nodes'}
                    </span>
                  </header>

                  <ul className="ia-spec-grid">
                    {sub.nodes.map((node) => (
                      <li key={`${sub.id}:${node.path}`} className="ia-spec-grid__item">
                        <article className="ia-spec-card" data-kind={node.kind}>
                          <Link href={node.href} className="ia-spec-card__link">
                            <span className="ia-spec-card__top">
                              <code className="ia-spec-card__path">{node.path}</code>
                              <span className="ia-spec-card__status">{node.status}</span>
                            </span>
                            <WireframeBars kind={node.kind} />
                            <h3 className="ia-spec-card__title">{node.title}</h3>
                            <p className="ia-spec-card__desc">{node.description}</p>
                            <span className="ia-spec-card__foot">
                              <span className="ia-spec-card__kind">{node.kind}</span>
                              {node.meta ? (
                                <span className="ia-spec-card__meta">{node.meta}</span>
                              ) : null}
                              <ArrowUpRight
                                size={15}
                                aria-hidden
                                className="ia-spec-card__arrow"
                              />
                            </span>
                          </Link>
                        </article>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : null}

          {/* ================================================================
              VIEW 3: INDEX (Compact Route Specification Ledger)
              ================================================================ */}
          {filteredSubsystems.length > 0 && viewMode === 'index' ? (
            <div className="ia-index-view">
              <div className="ia-index-head" aria-hidden="true">
                <span>Route Path</span>
                <span>Surface Title &amp; Specification</span>
                <span>Subsystem</span>
                <span>Status</span>
                <span>Action</span>
              </div>
              {filteredSubsystems.map((sub) => (
                <div key={sub.id} className="ia-index-section">
                  {sub.nodes.map((node) => (
                    <div key={`${sub.id}:${node.path}`} className="ia-index-row">
                      <div className="ia-index-row__route">
                        <Link href={node.href} className="ia-index-row__path-link">
                          <code>{node.path}</code>
                        </Link>
                      </div>
                      <div className="ia-index-row__main">
                        <Link href={node.href} className="ia-index-row__title">
                          {node.title}
                        </Link>
                        <p className="ia-index-row__desc">{node.description}</p>
                      </div>
                      <div className="ia-index-row__sub">
                        <span className="ia-index-row__sub-badge">{sub.title}</span>
                      </div>
                      <div className="ia-index-row__status">
                        <span className="ia-node__status">{node.status}</span>
                      </div>
                      <div className="ia-index-row__actions">
                        <CopyEndpointButton path={node.path} />
                        <Link
                          href={node.href}
                          className="ia-index-row__open"
                          aria-label={`Open ${node.title}`}
                        >
                          <ArrowUpRight size={14} aria-hidden />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ====================================================================
          01 ARCHITECTURAL TAXONOMY — SIX CORE SUBSYSTEMS AT A GLANCE
          ==================================================================== */}
      <section className="ia-taxonomy" aria-labelledby="ia-taxonomy-heading">
        <div className="container-content">
          <header className="ia-taxonomy__header">
            <p className="ia-taxonomy__eyebrow">
              <span className="ia-taxonomy__num">01</span>
              <span>ARCHITECTURAL TAXONOMY</span>
            </p>
            <h2 id="ia-taxonomy-heading" className="ia-taxonomy__title">
              Six Core Subsystems at a Glance
            </h2>
            <p className="ia-taxonomy__lead">
              Each module operates autonomously yet routes expedition discovery, landscape taxonomy,
              and field notes into one cohesive platform architecture.
            </p>
          </header>

          <div className="ia-taxonomy__grid">
            {subsystems.map((sub) => {
              const previewNodes = sub.nodes.slice(0, 4)
              const overflowCount = Math.max(0, sub.nodes.length - previewNodes.length)
              const isSelected = activeSubsystem === sub.id

              return (
                <article
                  key={sub.id}
                  className="ia-tax-card"
                  data-accent={sub.accent}
                  data-active={isSelected ? 'true' : undefined}
                >
                  <div className="ia-tax-card__meta">
                    <span className="ia-tax-card__kicker">
                      {sub.code} / {sub.kicker}
                    </span>
                    <span className="ia-tax-card__count">
                      {sub.nodes.length} {sub.nodes.length === 1 ? 'node' : 'nodes'}
                    </span>
                  </div>

                  <h3 className="ia-tax-card__title">{sub.title}</h3>
                  <p className="ia-tax-card__desc">{sub.description}</p>

                  <ul className="ia-tax-card__routes">
                    {previewNodes.map((node) => (
                      <li key={node.path} className="ia-tax-card__route-item">
                        <Link href={node.href} className="ia-tax-card__route-link">
                          <span className="ia-tax-card__route-name">{node.title}</span>
                          <code className="ia-tax-card__route-path">{node.path}</code>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {overflowCount > 0 ? (
                    <p className="ia-tax-card__more">
                      {`+ ${overflowCount} more ${overflowCount === 1 ? 'endpoint' : 'endpoints'}`}
                    </p>
                  ) : null}

                  <div className="ia-tax-card__footer">
                    <button
                      type="button"
                      className="ia-tax-card__filter-btn"
                      onClick={() => focusSubsystem(sub.id)}
                    >
                      <span>
                        {isSelected ? 'Filtered in map above' : 'Filter this subsystem'}
                      </span>
                      <ArrowUpRight size={14} aria-hidden />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
