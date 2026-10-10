import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from 'lucide-react'

import './footer.css'

import {
  BackToSummitButton,
  CopyEmailButton,
  FooterSpotlightFrame,
  HimalayanTelemetryAtlas,
  KathmanduBasecampClock,
} from './footer-client'
import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { getFooter, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

type ResolvedLink = { href: string; label: string; newTab: boolean }

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg width="9" height="16" viewBox="0 0 9.01 17" fill="none" aria-hidden="true">
      <path
        d="M8.419 9.563 8.887 6.486H5.965V4.489c0-.841.408-1.662 1.717-1.662h1.328V.208S7.805 0 6.652 0C4.247 0 2.674 1.474 2.674 4.141v2.345H0v3.077h2.674V17h3.291V9.563Z"
        fill="currentColor"
      />
    </svg>
  ),
  instagram: (
    <svg width="16" height="16" viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <rect
        x="0.75"
        y="0.75"
        width="15.5"
        height="15.5"
        rx="4.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="8.5" cy="8.5" r="3.6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.9" cy="4.1" r="1.05" fill="currentColor" />
    </svg>
  ),
  x: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.14 6.86 15.28 0h-1.46L8.5 5.96 4.66 0H0l6.42 9.14L0 16h1.46l5.62-6.3L11.34 16H16L9.14 6.86Zm-2 2.24-.65-.9L1.32 1.02h2.23l4.2 5.86.65.9 5.44 7.6h-2.23l-4.47-6.28Z"
        fill="currentColor"
      />
    </svg>
  ),
  youtube: (
    <svg width="17" height="12" viewBox="0 0 18 13" fill="none" aria-hidden="true">
      <path
        d="M17.6 2.03a2.1 2.1 0 0 0-1.48-1.49C14.8.2 9 .2 9 .2s-5.8 0-7.12.34A2.1 2.1 0 0 0 .4 2.03 22 22 0 0 0 0 6.5a22 22 0 0 0 .4 4.47 2.1 2.1 0 0 0 1.48 1.49c1.32.34 7.12.34 7.12.34s5.8 0 7.12-.34a2.1 2.1 0 0 0 1.48-1.49A22 22 0 0 0 18 6.5a22 22 0 0 0-.4-4.47ZM7.2 9.06V3.94L11.6 6.5Z"
        fill="currentColor"
      />
    </svg>
  ),
  linkedin: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.6 5.5H0.8V15h2.8V5.5ZM2.2 4.3a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3ZM15.2 9.9c0-3-1.6-4.6-3.9-4.6a3.4 3.4 0 0 0-3 1.6V5.5H5.5V15h2.8V9.8c0-1.3.6-2.1 1.8-2.1s1.7.8 1.7 2.1V15h2.8V9.9Z"
        fill="currentColor"
      />
    </svg>
  ),
  tiktok: (
    <svg width="13" height="15" viewBox="0 0 14 16" fill="none" aria-hidden="true">
      <path
        d="M10.8 0H8.2v10.6a2.9 2.9 0 1 1-2.4-2.86V5.1a5.5 5.5 0 1 0 5 5.47V5.9a6.3 6.3 0 0 0 3.2.9V4.2a4 4 0 0 1-3.2-4.2Z"
        fill="currentColor"
      />
    </svg>
  ),
}

const DEFAULT_COLUMNS: { heading: string; links: ResolvedLink[] }[] = [
  {
    heading: 'Field & Company',
    links: [
      { href: sitePath('/about'), label: 'About Our Team', newTab: false },
      { href: sitePath('/blog'), label: 'The Field Journal', newTab: false },
      { href: sitePath('/inquiry'), label: 'Custom Itineraries', newTab: false },
    ],
  },
]

/**
 * Columns retired from the footer to keep it minimal. They are dropped by heading so the
 * legacy CMS link columns (`footer.columns`) are pruned exactly like the hardcoded defaults.
 */
const RETIRED_COLUMN_HEADINGS = ['signature treks', 'mountain regions']

function KineticFooterLink({ link }: { link: ResolvedLink }) {
  const external = link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <Link className="hg-nav-link" href={link.href} {...external}>
      <span className="hg-nav-link-track" aria-hidden="true">
        <span className="hg-nav-link-line">{link.label}</span>
        <span className="hg-nav-link-line hg-nav-link-line--accent">{link.label}</span>
      </span>
      <span className="sr-only">{link.label}</span>
      <ArrowUpRight className="hg-nav-link-arrow" aria-hidden="true" />
    </Link>
  )
}

export async function Footer() {
  const [footer, settings, dict] = await Promise.all([
    getFooter(),
    getSettings(),
    Promise.resolve(dictionary),
  ])

  const siteName = settings.siteName || 'Hike Globally'
  const tagline = settings.tagline || 'Treks & expeditions in the Himalaya'
  const email = settings.email || 'hello@hikeglobally.com'
  const phone = settings.phone || '+977 1 452 8899'
  const whatsapp = settings.whatsapp || '9779851000000'
  const addressLine =
    settings.address?.split('\n')[0]?.trim() || 'Thamel, Kathmandu 44600, Nepal'
  const legalName = settings.legalName || 'Hike Globally Trekking Pvt. Ltd.'
  const responseNote =
    settings.responseTimeNote || 'A lead guide replies to every enquiry within 24 hours.'

  const introduction =
    footer.introduction ||
    'A Kathmandu- and Pokhara-based trekking operator. Fourteen years, thirty people, one country we know properly.'

  const copyright = (
    footer.copyright || `© {year} ${siteName}. ${dict.footer.rights}.`
  ).replace('{year}', String(new Date().getFullYear()))

  const cmsColumns = (footer.columns ?? [])
    .map((column) => ({
      heading: column.heading ?? '',
      links: (column.links ?? [])
        .map((item) => resolveLink(item.link))
        .filter((link): link is ResolvedLink => link !== null),
    }))
    .filter((column) => column.links.length > 0)

  const baseColumns = (cmsColumns.length > 0 ? cmsColumns : DEFAULT_COLUMNS).filter(
    (column) => !RETIRED_COLUMN_HEADINGS.includes(column.heading.trim().toLowerCase()),
  )

  const contactColumn = {
    heading: dict.footer.contactUs,
    links: [
      { href: sitePath('/inquiry'), label: dict.nav.inquiry, newTab: false },
      { href: `mailto:${email}`, label: email, newTab: false },
      { href: `tel:${phone.replace(/\s+/g, '')}`, label: phone, newTab: false },
      {
        href: `https://wa.me/${whatsapp}`,
        label: dict.inquiry.openWhatsApp,
        newTab: true,
      },
    ],
  }

  const columns =
    baseColumns.length >= 4
      ? baseColumns.slice(0, 4)
      : [...baseColumns, contactColumn].slice(0, 4)

  const cmsLegalLinks = (footer.legalLinks ?? [])
    .map((item) => resolveLink(item.link))
    .filter((link): link is ResolvedLink => link !== null)

  const legalLinks: ResolvedLink[] =
    cmsLegalLinks.length > 0
      ? cmsLegalLinks
      : [
          { href: sitePath('/about'), label: 'Ethics & Safety', newTab: false },
          { href: sitePath('/inquiry'), label: 'Custom Dispatch', newTab: false },
          { href: sitePath('/trips'), label: 'All Routes', newTab: false },
        ]

  const socials =
    settings.socials && settings.socials.length > 0
      ? settings.socials
      : [
          { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
          { platform: 'youtube', url: 'https://youtube.com/@hikeglobally' },
          { platform: 'x', url: 'https://x.com/hikeglobally' },
        ]

  return (
    <FooterSpotlightFrame>
      {/* Topographic Ridge Horizon Transition */}
      <div className="hg-horizon" aria-hidden="true">
        <svg
          viewBox="0 0 1440 84"
          preserveAspectRatio="none"
          className="hg-horizon-svg"
        >
          <path
            d="M0,84 L0,64 L90,54 L185,61 L290,38 L370,49 L485,22 L565,36 L675,14 L770,31 L880,6 L975,28 L1085,17 L1190,39 L1295,24 L1375,44 L1440,34 L1440,84 Z"
            fill="rgba(18, 69, 89, 0.22)"
          />
          <path
            d="M0,84 L0,72 L120,58 L230,66 L345,44 L440,56 L555,29 L650,45 L765,19 L870,38 L965,12 L1065,35 L1175,25 L1280,48 L1365,37 L1440,49 L1440,84 Z"
            fill="#01161e"
          />
          <path
            d="M0,72 L120,58 L230,66 L345,44 L440,56 L555,29 L650,45 L765,19 L870,38 L965,12 L1065,35 L1175,25 L1280,48 L1365,37 L1440,49"
            fill="none"
            stroke="rgba(174, 195, 176, 0.35)"
            strokeWidth="1.2"
          />
        </svg>

        <div className="container-content hg-horizon-markers">
          <span>KATHMANDU VALLEY · 1,400M</span>
          <span>NAMCHE BAZAAR · 3,440M</span>
          <span>LARKYA LA PASS · 5,106M</span>
          <span>THORONG LA · 5,416M</span>
          <span className="text-sage">CHOMOLUNGMA · 8,848M</span>
        </div>
      </div>

      {/* Ambient Topographic Contour Background & Spotlight */}
      <div className="hg-topo-canvas" aria-hidden="true">
        <div className="hg-topo-spotlight" />
        <svg
          className="hg-topo-svg"
          viewBox="0 0 1440 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="rgba(174, 195, 176, 0.055)" strokeWidth="1">
            <path d="M-120 180 C 240 90, 520 290, 890 160 C 1150 70, 1340 210, 1560 140" />
            <path d="M-120 260 C 210 160, 550 360, 910 230 C 1180 130, 1360 280, 1560 210" />
            <path d="M-120 340 C 190 240, 580 430, 940 300 C 1210 200, 1380 350, 1560 290" />
            <path d="M-120 440 C 260 350, 540 530, 880 410 C 1160 310, 1350 450, 1560 380" />
            <path d="M-120 550 C 300 460, 590 640, 930 510 C 1190 420, 1370 550, 1560 490" />
            <path d="M-120 670 C 260 580, 620 750, 960 620 C 1220 530, 1390 660, 1560 610" />
            <path d="M-120 790 C 240 700, 640 850, 990 730 C 1240 640, 1410 770, 1560 720" />
            <ellipse cx="1120" cy="260" rx="280" ry="125" transform="rotate(-11 1120 260)" />
            <ellipse cx="1120" cy="260" rx="190" ry="82" transform="rotate(-11 1120 260)" />
            <ellipse cx="1120" cy="260" rx="105" ry="44" transform="rotate(-11 1120 260)" />
            <ellipse cx="290" cy="620" rx="310" ry="135" transform="rotate(8 290 620)" />
            <ellipse cx="290" cy="620" rx="210" ry="88" transform="rotate(8 290 620)" />
          </g>
        </svg>
      </div>

      <div className="container-content hg-footer-shell">
        {/* ===================================================================
            TIER 1 — EXPEDITION DISPATCH & INTERACTIVE HIMALAYAN TELEMETRY ATLAS
           =================================================================== */}
        <section className="hg-command-deck" aria-label="Expedition Dispatch">
          <span className="hg-crosshair hg-crosshair--tl" aria-hidden="true">
            +
          </span>
          <span className="hg-crosshair hg-crosshair--tr" aria-hidden="true">
            +
          </span>
          <span className="hg-crosshair hg-crosshair--bl" aria-hidden="true">
            +
          </span>
          <span className="hg-crosshair hg-crosshair--br" aria-hidden="true">
            +
          </span>

          <div className="hg-dispatch-pane">
            <div className="hg-dispatch-eyebrow">
              <span className="hg-pulse-dot" aria-hidden="true" />
              <span>EXPEDITION DISPATCH · HIMALAYAN FIELD OPERATIONS</span>
            </div>

            <h2 className="hg-dispatch-heading">
              Where the paved road ends,{' '}
              <span className="hg-dispatch-highlight">our work begins.</span>
            </h2>

            <p className="hg-dispatch-lead">
              Tell us the pass, valley, or summit you are dreaming of. You will speak directly
              with the lead guide who walks the route — never a commission sales desk.
            </p>

            <div className="hg-dispatch-actions">
              <Link href={sitePath('/inquiry')} className="hg-cta-primary">
                <span>{dict.nav.inquiry}</span>
                <span className="hg-cta-primary-icon" aria-hidden="true">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>

              <Link href={sitePath('/trips')} className="hg-cta-secondary">
                <span>Browse all expeditions</span>
                <ArrowUpRight className="size-4 text-sage" aria-hidden="true" />
              </Link>
            </div>

            <div className="hg-dispatch-guarantee">
              <ShieldCheck className="size-4 shrink-0 text-sage" aria-hidden="true" />
              <span>{responseNote}</span>
            </div>
          </div>

          <div className="hg-atlas-pane">
            <HimalayanTelemetryAtlas />
          </div>
        </section>

        {/* ===================================================================
            TIER 2 — ARCHITECTURAL BENTO MATRIX (BRAND DOSSIER + NAV)
           =================================================================== */}
        <div className="hg-bento-matrix">
          {/* Left Column: Brand Dossier, Live Kathmandu Clock, Direct Comms */}
          <div className="hg-dossier">
            <div className="hg-brand-block">
              <Link href={sitePath('/')} className="hg-brand-link" aria-label={siteName}>
                <Image
                  src="/images/logo.svg"
                  alt=""
                  width={1297}
                  height={1212}
                  unoptimized
                  className="hg-brand-logo"
                />
                <span className="hg-brand-text">
                  <span className="hg-brand-name">{siteName}</span>
                  <span className="hg-brand-tagline">{tagline}</span>
                </span>
              </Link>

              <p className="hg-brand-intro">{introduction}</p>
            </div>

            {/* Live Kathmandu Basecamp Clock */}
            <KathmanduBasecampClock />

            {/* Direct Basecamp Contact Channels */}
            <div className="hg-comms-list">
              <div className="hg-comms-item">
                <span className="hg-comms-icon" aria-hidden="true">
                  <Mail className="size-3.5" />
                </span>
                <div className="hg-comms-body">
                  <span className="hg-comms-label">DIRECT DISPATCH</span>
                  <div className="hg-comms-value-row">
                    <a href={`mailto:${email}`} className="hg-comms-link">
                      {email}
                    </a>
                    <CopyEmailButton email={email} />
                  </div>
                </div>
              </div>

              <div className="hg-comms-item">
                <span className="hg-comms-icon" aria-hidden="true">
                  <Phone className="size-3.5" />
                </span>
                <div className="hg-comms-body">
                  <span className="hg-comms-label">KATHMANDU OPS DESK</span>
                  <div className="hg-comms-value-row">
                    <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hg-comms-link">
                      {phone}
                    </a>
                    {whatsapp ? (
                      <a
                        href={`https://wa.me/${whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hg-whatsapp-pill"
                      >
                        <MessageCircle className="size-3" aria-hidden="true" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="hg-comms-item">
                <span className="hg-comms-icon" aria-hidden="true">
                  <MapPin className="size-3.5" />
                </span>
                <div className="hg-comms-body">
                  <span className="hg-comms-label">FIELD HEADQUARTERS</span>
                  <span className="hg-comms-text">{addressLine}</span>
                </div>
              </div>
            </div>

            {/* Architectural Social Links */}
            {socials.length > 0 ? (
              <div className="hg-socials-block">
                <span className="hg-socials-label">FIELD DISPATCH CHANNELS</span>
                <ul className="hg-socials-list">
                  {socials.map((social) => (
                    <li key={`${social.platform}-${social.url}`}>
                      <a
                        className="hg-social-btn"
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.platform}
                      >
                        {SOCIAL_ICONS[social.platform] ?? SOCIAL_ICONS.x}
                        <span className="hg-social-name">{social.platform}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Right Column: Navigation Matrix */}
          <div className="hg-nav-matrix">
            <nav className="hg-nav-grid" aria-label="Footer navigation">
              {columns.map((column, colIdx) => (
                <div className="hg-nav-col" key={`${column.heading}-${colIdx}`}>
                  <div className="hg-nav-col-header">
                    <span className="hg-nav-col-index">
                      {String(colIdx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="hg-nav-col-title">{column.heading}</h3>
                  </div>

                  <ul className="hg-nav-col-list">
                    {column.links.map((link) => (
                      <li key={`${link.href}-${link.label}`}>
                        <KineticFooterLink link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* ===================================================================
            TIER 3 — MONUMENTAL ARCHITECTURAL WORDMARK & SUMMIT RETURN
           =================================================================== */}
        <div className="hg-monument-bar">
          <div className="hg-monument-wordmark-wrap" aria-hidden="true">
            <span className="hg-monument-kicker">
              HIMALAYAN EXPEDITION ARCHITECTURE · 27°59′17″N 86°55′31″E
            </span>
            <div
              className="hg-monument-wordmark"
              style={{
                ['--hg-chars' as string]: String(Math.max(siteName.length, 8)),
              }}
            >
              {siteName}
            </div>
          </div>

          <div className="hg-monument-action">
            <BackToSummitButton />
          </div>
        </div>

        {/* ===================================================================
            TIER 4 — COLOPHON & LEGAL BAR
           =================================================================== */}
        <div className="hg-colophon">
          <div className="hg-colophon-left">
            <span className="hg-colophon-copy">{copyright}</span>
            <span className="hg-colophon-sep" aria-hidden="true">
              /
            </span>
            <span className="hg-colophon-entity">{legalName}</span>
          </div>

          <ul className="hg-colophon-links">
            {legalLinks.map((link) => {
              const external = link.newTab
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {}
              return (
                <li key={`${link.href}-${link.label}`}>
                  <Link className="hg-colophon-link" href={link.href} {...external}>
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          <div className="hg-colophon-right">
            <span className="hg-colophon-stamp">
              CRAFTED AT 1,400M · KATHMANDU, NEPAL
            </span>
          </div>
        </div>
      </div>
    </FooterSpotlightFrame>
  )
}
