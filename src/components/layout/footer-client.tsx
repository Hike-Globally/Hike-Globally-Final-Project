'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowUpRight, Check, Compass, Copy, Mountain } from 'lucide-react'

type SectorTelemetry = {
  id: string
  code: string
  name: string
  peakName: string
  peakElevation: string
  trekHighPoint: string
  coordinates: string
  season: string
  duration: string
  status: string
  href: string
  waypoints: { label: string; elev: string; x: number; y: number }[]
  linePath: string
  areaPath: string
}

const SECTORS: SectorTelemetry[] = [
  {
    id: 'khumbu',
    code: 'SEC-01',
    name: 'Khumbu · Everest',
    peakName: 'Chomolungma (Everest)',
    peakElevation: '8,848 m',
    trekHighPoint: '5,364 m EBC · 5,545 m Kala Patthar',
    coordinates: '27°59′17″N  86°55′31″E',
    season: 'Mar–May · Sep–Nov',
    duration: '12–18 Days',
    status: 'Permits Active · Clear Ridge',
    href: '/destinations/khumbu',
    waypoints: [
      { label: 'Lukla', elev: '2,860m', x: 24, y: 112 },
      { label: 'Namche', elev: '3,440m', x: 112, y: 92 },
      { label: 'Tengboche', elev: '3,860m', x: 204, y: 78 },
      { label: 'Dingboche', elev: '4,410m', x: 296, y: 58 },
      { label: 'Lobuche', elev: '4,940m', x: 388, y: 40 },
      { label: 'Base Camp', elev: '5,364m', x: 476, y: 22 },
    ],
    linePath:
      'M 24 112 C 65 106, 82 96, 112 92 C 150 86, 172 82, 204 78 C 244 72, 264 64, 296 58 C 336 50, 356 45, 388 40 C 426 33, 448 27, 476 22',
    areaPath:
      'M 24 112 C 65 106, 82 96, 112 92 C 150 86, 172 82, 204 78 C 244 72, 264 64, 296 58 C 336 50, 356 45, 388 40 C 426 33, 448 27, 476 22 L 476 136 L 24 136 Z',
  },
  {
    id: 'annapurna',
    code: 'SEC-02',
    name: 'Annapurna Sanctuary',
    peakName: 'Annapurna I Massif',
    peakElevation: '8,091 m',
    trekHighPoint: '4,130 m Sanctuary · 5,416 m Thorong La',
    coordinates: '28°35′46″N  83°49′13″E',
    season: 'Mar–May · Oct–Dec',
    duration: '10–16 Days',
    status: 'Sanctuary Trail Open',
    href: '/destinations/annapurna',
    waypoints: [
      { label: 'Ghandruk', elev: '1,940m', x: 24, y: 118 },
      { label: 'Chomrong', elev: '2,170m', x: 112, y: 106 },
      { label: 'Bamboo', elev: '2,310m', x: 204, y: 98 },
      { label: 'Deurali', elev: '3,230m', x: 296, y: 68 },
      { label: 'MBC', elev: '3,700m', x: 388, y: 48 },
      { label: 'ABC', elev: '4,130m', x: 476, y: 30 },
    ],
    linePath:
      'M 24 118 C 62 114, 84 109, 112 106 C 148 102, 174 101, 204 98 C 246 92, 264 76, 296 68 C 336 58, 358 53, 388 48 C 424 41, 450 35, 476 30',
    areaPath:
      'M 24 118 C 62 114, 84 109, 112 106 C 148 102, 174 101, 204 98 C 246 92, 264 76, 296 68 C 336 58, 358 53, 388 48 C 424 41, 450 35, 476 30 L 476 136 L 24 136 Z',
  },
  {
    id: 'manaslu',
    code: 'SEC-03',
    name: 'Manaslu Circuit',
    peakName: 'Manaslu (Kutang)',
    peakElevation: '8,163 m',
    trekHighPoint: '5,106 m Larkya La Pass',
    coordinates: '28°33′00″N  84°33′35″E',
    season: 'Mar–May · Sep–Nov',
    duration: '14–16 Days',
    status: 'Restricted Permit · Quiet Trail',
    href: '/destinations/manaslu',
    waypoints: [
      { label: 'Soti Khola', elev: '710m', x: 24, y: 122 },
      { label: 'Namrung', elev: '2,630m', x: 112, y: 94 },
      { label: 'Samagaon', elev: '3,530m', x: 204, y: 70 },
      { label: 'Samdo', elev: '3,860m', x: 296, y: 56 },
      { label: 'Larkya La', elev: '5,106m', x: 388, y: 20 },
      { label: 'Bimthang', elev: '3,720m', x: 476, y: 62 },
    ],
    linePath:
      'M 24 122 C 60 112, 82 102, 112 94 C 150 83, 172 76, 204 70 C 244 63, 266 61, 296 56 C 336 46, 358 20, 388 20 C 420 20, 446 50, 476 62',
    areaPath:
      'M 24 122 C 60 112, 82 102, 112 94 C 150 83, 172 76, 204 70 C 244 63, 266 61, 296 56 C 336 46, 358 20, 388 20 C 420 20, 446 50, 476 62 L 476 136 L 24 136 Z',
  },
  {
    id: 'mustang',
    code: 'SEC-04',
    name: 'Upper Mustang',
    peakName: 'Lo Manthang Kingdom',
    peakElevation: '6,584 m Nilgiri',
    trekHighPoint: '4,280 m Marang La · 3,840 m Walled City',
    coordinates: '29°11′00″N  83°57′00″E',
    season: 'Apr–Nov (Rain-Shadow)',
    duration: '12–14 Days',
    status: 'Monsoon-Safe Corridor',
    href: '/destinations/mustang',
    waypoints: [
      { label: 'Jomsom', elev: '2,720m', x: 24, y: 104 },
      { label: 'Kagbeni', elev: '2,810m', x: 112, y: 98 },
      { label: 'Chele', elev: '3,050m', x: 204, y: 84 },
      { label: 'Syangboche', elev: '3,800m', x: 296, y: 50 },
      { label: 'Marang La', elev: '4,280m', x: 388, y: 32 },
      { label: 'Lo Manthang', elev: '3,840m', x: 476, y: 48 },
    ],
    linePath:
      'M 24 104 C 60 102, 84 100, 112 98 C 148 94, 174 90, 204 84 C 246 74, 264 58, 296 50 C 336 40, 358 32, 388 32 C 424 32, 448 43, 476 48',
    areaPath:
      'M 24 104 C 60 102, 84 100, 112 98 C 148 94, 174 90, 204 84 C 246 74, 264 58, 296 50 C 336 40, 358 32, 388 32 C 424 32, 448 43, 476 48 L 476 136 L 24 136 Z',
  },
]

export function FooterSpotlightFrame({ children }: { children: ReactNode }) {
  const footerRef = useRef<HTMLElement>(null)

  return (
    <footer
      ref={footerRef}
      className="hg-footer"
      onPointerMove={(event) => {
        const el = footerRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        el.style.setProperty('--hg-spot-x', `${Math.round(event.clientX - rect.left)}px`)
        el.style.setProperty('--hg-spot-y', `${Math.round(event.clientY - rect.top)}px`)
      }}
    >
      {children}
    </footer>
  )
}

export function HimalayanTelemetryAtlas() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hoveredWaypoint, setHoveredWaypoint] = useState<number | null>(null)
  const sector = SECTORS[activeIndex] ?? SECTORS[0]!

  return (
    <div className="hg-atlas" aria-label="Himalayan Sector Elevation Telemetry">
      {/* Header bar with live telemetry status */}
      <div className="hg-atlas-header">
        <div className="hg-atlas-badge">
          <Compass className="size-3.5 text-sage" aria-hidden="true" />
          <span>TOPOGRAPHIC TELEMETRY · NEPAL HIMALAYA</span>
        </div>
        <span className="hg-atlas-coords">{sector.coordinates}</span>
      </div>

      {/* Sector Selector Tabs */}
      <div className="hg-atlas-tabs" role="tablist" aria-label="Himalayan trekking sectors">
        {SECTORS.map((item, idx) => {
          const isSelected = idx === activeIndex
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className="hg-atlas-tab"
              data-active={isSelected}
              onClick={() => {
                setActiveIndex(idx)
                setHoveredWaypoint(null)
              }}
            >
              <span className="hg-atlas-tab-code">{item.code}</span>
              <span className="hg-atlas-tab-name">{item.name}</span>
            </button>
          )
        })}
      </div>

      {/* Elevation Profile SVG Chart */}
      <div className="hg-atlas-stage">
        <div className="hg-atlas-stage-meta">
          <div>
            <p className="hg-atlas-peak-label">SECTOR SUMMIT</p>
            <p className="hg-atlas-peak-title">
              {sector.peakName} <span className="text-sage">· {sector.peakElevation}</span>
            </p>
          </div>
          <div className="hg-atlas-status-pill">
            <span className="hg-pulse-dot" aria-hidden="true" />
            <span>{sector.status}</span>
          </div>
        </div>

        <div className="hg-atlas-chart-wrap">
          <svg
            viewBox="0 0 500 152"
            className="hg-atlas-svg"
            role="img"
            aria-label={`Elevation profile for ${sector.name}`}
          >
            <defs>
              <linearGradient id="hgAtlasAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#aec3b0" stopOpacity="0.28" />
                <stop offset="65%" stopColor="#124559" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#01161e" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="hgAtlasLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#598392" />
                <stop offset="55%" stopColor="#aec3b0" />
                <stop offset="100%" stopColor="#f8f9fa" />
              </linearGradient>
            </defs>

            {/* Horizontal elevation grid lines */}
            {[28, 64, 100, 136].map((y, idx) => (
              <line
                key={y}
                x1="16"
                y1={y}
                x2="484"
                y2={y}
                stroke="rgba(174, 195, 176, 0.11)"
                strokeDasharray={idx === 3 ? undefined : '3 5'}
                strokeWidth="1"
              />
            ))}

            {/* Shaded area under curve */}
            <path d={sector.areaPath} fill="url(#hgAtlasAreaGrad)" className="hg-atlas-area" />

            {/* Elevation profile curve */}
            <path
              d={sector.linePath}
              fill="none"
              stroke="url(#hgAtlasLineGrad)"
              strokeWidth="2.25"
              strokeLinecap="round"
              className="hg-atlas-line"
            />

            {/* Waypoint nodes and labels */}
            {sector.waypoints.map((wp, idx) => {
              const isHighlighted =
                hoveredWaypoint === idx ||
                (hoveredWaypoint === null && idx === sector.waypoints.length - 1)
              return (
                <g
                  key={wp.label}
                  className="hg-atlas-wp"
                  onMouseEnter={() => setHoveredWaypoint(idx)}
                  onMouseLeave={() => setHoveredWaypoint(null)}
                >
                  <line
                    x1={wp.x}
                    y1={wp.y}
                    x2={wp.x}
                    y2={136}
                    stroke={
                      isHighlighted ? 'rgba(174, 195, 176, 0.55)' : 'rgba(174, 195, 176, 0.15)'
                    }
                    strokeDasharray="2 3"
                    strokeWidth="1"
                  />
                  {isHighlighted ? (
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r="8"
                      fill="rgba(174, 195, 176, 0.18)"
                      stroke="rgba(174, 195, 176, 0.45)"
                      strokeWidth="1"
                    />
                  ) : null}
                  <circle
                    cx={wp.x}
                    cy={wp.y}
                    r={isHighlighted ? '4' : '3'}
                    fill={isHighlighted ? '#f8f9fa' : '#aec3b0'}
                    stroke="#01161e"
                    strokeWidth="1.5"
                  />
                  <text
                    x={wp.x}
                    y={wp.y - 10}
                    textAnchor={
                      idx === 0
                        ? 'start'
                        : idx === sector.waypoints.length - 1
                          ? 'end'
                          : 'middle'
                    }
                    fill={isHighlighted ? '#f8f9fa' : 'rgba(248, 249, 250, 0.65)'}
                    fontSize="9.5"
                    fontWeight="600"
                    letterSpacing="0.04em"
                  >
                    {wp.elev}
                  </text>
                  <text
                    x={wp.x}
                    y={148}
                    textAnchor={
                      idx === 0
                        ? 'start'
                        : idx === sector.waypoints.length - 1
                          ? 'end'
                          : 'middle'
                    }
                    fill={isHighlighted ? '#aec3b0' : 'rgba(248, 249, 250, 0.48)'}
                    fontSize="9.5"
                    letterSpacing="0.02em"
                  >
                    {wp.label}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Bottom specs bar */}
        <div className="hg-atlas-specs">
          <div className="hg-atlas-spec">
            <span className="hg-atlas-spec-k">HIGH POINT</span>
            <span className="hg-atlas-spec-v">{sector.trekHighPoint}</span>
          </div>
          <div className="hg-atlas-spec">
            <span className="hg-atlas-spec-k">OPTIMAL WINDOW</span>
            <span className="hg-atlas-spec-v">{sector.season}</span>
          </div>
          <div className="hg-atlas-spec">
            <span className="hg-atlas-spec-k">DURATION</span>
            <span className="hg-atlas-spec-v">{sector.duration}</span>
          </div>
          <Link href={sector.href} className="hg-atlas-explore">
            <span>Explore region</span>
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export function KathmanduBasecampClock() {
  const [timeState, setTimeState] = useState<{
    timeString: string
    isOpen: boolean
  } | null>(null)

  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kathmandu',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        const parts = formatter.formatToParts(now)
        const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12)
        const isOpen = hour >= 6 && hour < 21
        setTimeState({
          timeString: formatter.format(now),
          isOpen,
        })
      } catch {
        setTimeState({
          timeString: '14:45:00',
          isOpen: true,
        })
      }
    }

    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="hg-telemetry-card">
      <div className="hg-telemetry-row">
        <div className="hg-telemetry-station">
          <Mountain className="size-3.5 text-sage" aria-hidden="true" />
          <span>BASECAMP HQ · KATHMANDU, NEPAL</span>
        </div>
        <span className="hg-telemetry-tz">NPT (UTC+05:45)</span>
      </div>

      <div className="hg-telemetry-main">
        <div className="hg-telemetry-clock" suppressHydrationWarning>
          {timeState ? timeState.timeString : '— — : — — : — —'}
        </div>
        <div className="hg-telemetry-status" data-open={timeState?.isOpen ?? true}>
          <span className="hg-pulse-dot" aria-hidden="true" />
          <span>
            {timeState === null || timeState.isOpen
              ? 'TRAIL DESK LIVE'
              : 'NIGHT WATCH · REPLIES AT DAWN'}
          </span>
        </div>
      </div>

      <div className="hg-telemetry-foot">
        <span>27°42′54″N · 85°18′44″E</span>
        <span aria-hidden="true">·</span>
        <span>ALTITUDE 1,400 M ASL</span>
      </div>
    </div>
  )
}

export function CopyEmailButton({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      className="hg-copy-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2200)
        } catch {
          // Ignore clipboard permission errors
        }
      }}
      aria-label={`Copy ${email} to clipboard`}
      title={copied ? 'Copied' : 'Copy email address'}
    >
      {copied ? (
        <>
          <Check className="size-3 text-sage" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" aria-hidden="true" />
          <span>Copy</span>
        </>
      )}
    </button>
  )
}

export function BackToSummitButton() {
  return (
    <button
      type="button"
      className="hg-summit-btn"
      onClick={() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      }}
      aria-label="Scroll back to top of page"
    >
      <span className="hg-summit-meta">
        <span className="hg-summit-k">RETURN TO SUMMIT</span>
        <span className="hg-summit-v">00°00′N · TOP OF PAGE</span>
      </span>
      <span className="hg-summit-icon" aria-hidden="true">
        <ArrowUp className="size-4" />
      </span>
    </button>
  )
}
