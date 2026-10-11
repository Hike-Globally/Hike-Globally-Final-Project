import Link from 'next/link'
import { MapPin } from 'lucide-react'

import { dictionary, t } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getFooter, getSettings } from '@/lib/data'
import { resolveLink, type ResolvedLink } from '@/lib/links'
import type { Setting } from '@/payload-types'

import './footer.css'

/**
 * Site footer — the full-width dark footer ported from `footer-sample.png`,
 * rendered once from the root layout so it is the global, sitewide footer.
 *
 * Content still comes from the `footer` + `settings` Payload globals:
 *   • introduction   → the "About" statement under the wordmark
 *   • columns        → the sitemap-style link columns
 *   • legalLinks     → the legal column
 *   • copyright      → bottom-left line (`{year}` is interpolated)
 *   • settings       → wordmark text, socials, contact column, location
 */

type SocialPlatform = NonNullable<Setting['socials']>[number]['platform']

type FooterColumn = { heading: string; links: ResolvedLink[] }

/* -------------------------------------------------------------------------- */
/* Social glyphs — one per platform the CMS offers. Facebook / Instagram /     */
/* YouTube / LinkedIn use lucide-style strokes; X and TikTok are brand glyphs  */
/* (lucide has no mark for them), both optically sized to the same box.        */
/* -------------------------------------------------------------------------- */
function SocialIcon({ platform }: { platform: SocialPlatform }) {
  const stroke = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const

  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...stroke}>
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...stroke}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...stroke}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" {...stroke}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect width="4" height="12" x="2" y="9" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="currentColor">
          <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
  }
}

const platformLabel: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
}

/** External links keep the browser tab; internal ones use next/link prefetching. */
function FooterLink({ link }: { link: ResolvedLink }) {
  const external = /^https?:\/\//.test(link.href)
  const className =
    'text-xs leading-none text-mist/90 transition-colors hover:text-white hover:underline underline-offset-4'

  return external ? (
    <a href={link.href} className={className} target="_blank" rel="noopener noreferrer">
      {link.label}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  )
}

function FooterColumnBlock({ column }: { column: FooterColumn }) {
  return (
    <nav aria-label={column.heading}>
      <h3 className="font-heading text-xs font-semibold text-white">{column.heading}</h3>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLink link={link} />
          </li>
        ))}
      </ul>
    </nav>
  )
}

/* The sample fills the right half with three columns; wider CMS content gets
   up to six, so the inner grid picks its track count from the column count. */
const rightGridCols: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
  6: 'xl:grid-cols-6',
}

export async function Footer() {
  const [footer, settings, dict] = [await getFooter(), await getSettings(), dictionary]

  /* --- About column: CMS introduction + the social chips ------------------ */
  const introduction = footer.introduction ?? dict.footer.introductionFallback

  const socials = settings.socials?.length
    ? settings.socials
    : ([
        { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
        { platform: 'youtube', url: 'https://youtube.com/@hikeglobally' },
      ] as NonNullable<Setting['socials']>)

  /* --- Sitemap-style columns: CMS `columns`, falling back like the header - */
  const cmsColumns: FooterColumn[] = (footer.columns ?? [])
    .map((column) => ({
      heading: column.heading,
      links: (column.links ?? [])
        .map((row) => resolveLink(row.link))
        .filter((link): link is ResolvedLink => link !== null),
    }))
    .filter((column) => column.links.length > 0)

  const fallbackColumns: FooterColumn[] = [
    {
      heading: dict.nav.trips,
      links: [
        { href: sitePath('/trips'), label: dict.footer.allTrips, newTab: false },
        { href: sitePath('/destinations'), label: dict.nav.destinations, newTab: false },
        { href: sitePath('/blog'), label: dict.nav.blog, newTab: false },
      ],
    },
    {
      heading: dict.footer.company,
      links: [
        { href: sitePath('/about'), label: dict.footer.aboutUs, newTab: false },
        { href: sitePath('/inquiry'), label: dict.nav.contact, newTab: false },
      ],
    },
  ]

  /* --- Legal column: CMS `legalLinks` ------------------------------------- */
  const legalLinks = (footer.legalLinks ?? [])
    .map((row) => resolveLink(row.link))
    .filter((link): link is ResolvedLink => link !== null)

  const fallbackLegalLinks: ResolvedLink[] = [
    { href: sitePath('/privacy'), label: dict.footer.privacy, newTab: false },
    { href: sitePath('/terms'), label: dict.footer.terms, newTab: false },
  ]

  /* --- Contact column: the `settings` global ------------------------------- */
  const contactLinks: ResolvedLink[] = [
    { href: sitePath('/inquiry'), label: dict.nav.inquiry, newTab: false },
    { href: `mailto:${settings.email}`, label: settings.email, newTab: false },
    ...(settings.phone
      ? [
          {
            href: `tel:${settings.phone.replace(/[^+\d]/g, '')}`,
            label: settings.phone,
            newTab: false,
          },
        ]
      : []),
  ]

  const rightColumns: FooterColumn[] = [
    ...(cmsColumns.length ? cmsColumns : fallbackColumns),
    {
      heading: dict.footer.legalPages,
      links: legalLinks.length ? legalLinks : fallbackLegalLinks,
    },
    { heading: dict.footer.contactUs, links: contactLinks },
  ]

  const tracks = rightGridCols[Math.min(rightColumns.length, 6)] ?? 'xl:grid-cols-3'

  /* --- Bottom bar ---------------------------------------------------------- */
  const year = new Date().getFullYear()
  const copyright = t(footer.copyright ?? dict.footer.copyright, {
    year,
    site: settings.siteName,
  })
  const location = settings.address ?? dict.footer.locationFallback

  return (
    <footer className="hg-footer" aria-label={dict.footer.label}>
      {/* 1 — the giant edge-to-edge wordmark */}
      <div className="px-5 pt-8 sm:px-8 md:pt-12">
        <svg
          viewBox="0 0 780 78"
          className="hg-footer__wordmark"
          role="img"
          aria-label={settings.siteName}
        >
          <text
            x="0"
            y="74"
            textLength="780"
            lengthAdjust="spacingAndGlyphs"
            className="hg-footer__wordmark-text"
          >
            {settings.siteName.toUpperCase()}
          </text>
        </svg>
      </div>

      {/* 2 — about + social chips on the left, link columns on the right */}
      <div className="mt-14 grid gap-12 px-5 sm:px-8 md:mt-24 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 xl:col-span-4">
          <h3 className="font-heading text-xs font-semibold text-white">{dict.footer.about}</h3>
          <p className="mt-4 max-w-[34ch] text-xs leading-relaxed text-mist/90">{introduction}</p>
          <div className="mt-8 flex gap-2.5">
            {socials.map((social) => (
              <a
                key={social.platform}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platformLabel[social.platform]}
                className="hg-footer__social"
              >
                <SocialIcon platform={social.platform} />
              </a>
            ))}
          </div>
        </div>

        <div
          className={`grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:gap-x-6 xl:col-span-8 ${tracks}`}
        >
          {rightColumns.map((column) => (
            <FooterColumnBlock key={column.heading} column={column} />
          ))}
        </div>
      </div>

      {/* 3 — copyright left, location right, pinned to the very bottom */}
      <div className="mt-16 flex flex-col gap-3 px-5 pb-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:mt-24">
        <p className="text-[11px] leading-none text-mist/80">{copyright}</p>
        <p className="flex items-center gap-1.5 text-[11px] leading-none text-mist/80">
          <MapPin size={12} strokeWidth={2} aria-hidden="true" />
          {location}
        </p>
      </div>
    </footer>
  )
}
