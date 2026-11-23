import Link from 'next/link'

import { dictionary, t } from '@/i18n/dictionaries'
import { routes, sitePath } from '@/i18n/config'
import { getAllPageSlugs, getFooter, getSettings } from '@/lib/data'
import { resolveLink, type ResolvedLink } from '@/lib/links'
import { withPlacesFooterLink } from '@/lib/places-navigation'
import { mailtoHref, protectedEmailHtmlProps } from '@/lib/public-email'
import type { Setting } from '@/payload-types'

import './footer.css'

/**
 * Site footer — the full-width dark footer ported from `docs/assets/footer-sample.png`,
 * rendered once from the root layout so it is the global, sitewide footer.
 *
 * Content still comes from the `footer` + `settings` Payload globals:
 *   • introduction   → the "About" statement
 *   • columns        → the sitemap-style link columns
 *   • legalLinks     → the legal column
 *   • copyright      → bottom-left line (`{year}` is interpolated)
 *   • settings       → socials and contact details
 *
 * Both rows sit in `container-content`, so the About column starts on the exact
 * same line as every section above it — the centred content column the "Plan your
 * trip" box (and the rest of the page) is built on — instead of on the raw gutter.
 */

type SocialPlatform = NonNullable<Setting['socials']>[number]['platform']

/**
 * A resolved link, plus — for the contact address — the pre-built HTML for its label.
 *
 * The label of a `mailto:` link has to bypass JSX text nodes so Cloudflare's `email_off` comment
 * markers survive into the response (see `src/lib/public-email.ts`).
 */
type FooterLinkItem = ResolvedLink & {
  emailHtml?: { dangerouslySetInnerHTML: { __html: string } }
}

type FooterColumn = { heading: string; links: FooterLinkItem[] }

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

const STATIC_ROUTE_ROOTS = new Set<string>(Object.values(routes))

/**
 * Only prefetch internal links whose route actually exists as a static route or a published CMS
 * page. Prefetching unpublished fallback slugs (`/about`, `/privacy`, `/terms`) would otherwise
 * fire three uncached serverless 404 renders on Fluid Compute every time a visitor scrolls down.
 */
const canPrefetchInternalHref = (
  href: string,
  publishedPageSlugs: ReadonlySet<string>,
): boolean => {
  if (!href.startsWith('/')) return false
  const [pathname = '/'] = href.split(/[?#]/, 1)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return true
  if (STATIC_ROUTE_ROOTS.has(segments[0]!)) return true
  return segments.length === 1 && publishedPageSlugs.has(segments[0]!)
}

/**
 * External/protocol links use plain `<a>`; internal routes use `next/link` with safe prefetching.
 *
 * `emailHtml` is set for the contact address only. Cloudflare rewrites a `mailto:` link into a
 * `/cdn-cgi/l/email-protection` placeholder unless the visible address is wrapped in its opt-out
 * comments, and React drops comment nodes from JSX — so that one label is injected as raw HTML.
 * See `src/lib/public-email.ts`.
 */
function FooterLink({
  link,
  publishedPageSlugs,
  emailHtml,
}: {
  link: ResolvedLink
  publishedPageSlugs: ReadonlySet<string>
  emailHtml?: { dangerouslySetInnerHTML: { __html: string } }
}) {
  const external = /^https?:\/\//.test(link.href)
  const nonHttpProtocol = /^(?:mailto|tel):/i.test(link.href)
  const className =
    'text-small leading-normal text-mist/80 transition-colors hover:text-white hover:underline underline-offset-4'

  if (external) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noopener noreferrer">
        {link.label}
      </a>
    )
  }

  if (nonHttpProtocol) {
    return (
      <a href={link.href} className={className} {...emailHtml}>
        {emailHtml ? null : link.label}
      </a>
    )
  }

  const prefetch = canPrefetchInternalHref(link.href, publishedPageSlugs) ? undefined : false

  return (
    <Link href={link.href} prefetch={prefetch} className={className}>
      {link.label}
    </Link>
  )
}

function FooterColumnBlock({
  column,
  publishedPageSlugs,
}: {
  column: FooterColumn
  publishedPageSlugs: ReadonlySet<string>
}) {
  return (
    <nav aria-label={column.heading}>
      <h3 className="hg-footer__heading">{column.heading}</h3>
      <ul className="mt-4 space-y-2.5">
        {column.links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <FooterLink
              link={link}
              publishedPageSlugs={publishedPageSlugs}
              emailHtml={link.emailHtml}
            />
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
  const [footer, settings, pageSlugs] = await Promise.all([
    getFooter(),
    getSettings(),
    getAllPageSlugs(),
  ])
  const dict = dictionary
  const publishedPageSlugs = new Set(pageSlugs)

  /* --- About column: CMS introduction + the social chips ------------------ */
  const introduction = footer.introduction ?? dict.footer.introductionFallback

  /* Facebook, Instagram and LinkedIn are the three channels the footer shows.
     Profiles edited in the CMS still drive the row (and can add others), but a
     YouTube entry is left out, and with nothing usable stored — or a database
     that has not been seeded — the trio above is rendered rather than no icons. */
  const cmsSocials = (settings.socials ?? []).filter((social) => social.platform !== 'youtube')
  const socials: NonNullable<Setting['socials']> = cmsSocials.length
    ? cmsSocials
    : [
        { platform: 'facebook', url: 'https://facebook.com/hikeglobally' },
        { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
        { platform: 'linkedin', url: 'https://linkedin.com/company/hikeglobally' },
      ]

  /* --- Sitemap-style columns: CMS `columns`, falling back like the header - */
  const cmsColumns: FooterColumn[] = (footer.columns ?? [])
    .map((column) => ({
      heading: column.heading,
      links: (column.links ?? [])
        .map((row) => resolveLink(row.link))
        .filter((link): link is ResolvedLink => link !== null),
    }))
    .filter((column) => column.links.length > 0)

  /* The navigation chart is guaranteed to appear under the Company column: the CMS owns the
     column, this code only appends the one link the footer always carries. Any column that
     already links to it (or a heading that is not Company) is left exactly as the CMS wrote it. */
  const sitemapHref = sitePath('/sitemap')
  const sitemapLink = { href: sitemapHref, label: dict.footer.sitemap, newTab: false }
  const columnsWithSitemap = cmsColumns.map((column) => {
    const isCompany = column.heading === dict.footer.company
    if (!isCompany || column.links.some((link) => link.href === sitemapHref)) return column
    return { ...column, links: [...column.links, sitemapLink] }
  })

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
        // The authors index is the hub for every profile page; without a chrome link it is only
        // reachable from a profile's own breadcrumb.
        { href: sitePath('/authors'), label: dict.authors.allAuthors, newTab: false },
        { href: sitePath('/contact'), label: dict.nav.contact, newTab: false },
        { href: sitePath('/sitemap'), label: dict.footer.sitemap, newTab: false },
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
  /* The email label is HTML, not a JSX text node, so Cloudflare's `email_off` comments reach the
     browser and it leaves the `mailto:` link alone (see `src/lib/public-email.ts`). */
  const contactEmailHref = mailtoHref(settings.email)

  const contactLinks: FooterLinkItem[] = [
    { href: sitePath('/contact'), label: dict.nav.inquiry, newTab: false },
    ...(contactEmailHref
      ? [
          {
            href: contactEmailHref,
            label: settings.email,
            newTab: false,
            emailHtml: protectedEmailHtmlProps(settings.email),
          },
        ]
      : []),
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

  const hasCompanyColumn = columnsWithSitemap.some((column) => column.heading === dict.footer.company)
  const hasAbout = columnsWithSitemap.some((column) =>
    column.links.some((link) => link.href === '/about'),
  )

  const rightColumns: FooterColumn[] = [
    ...withPlacesFooterLink(cmsColumns.length ? columnsWithSitemap : fallbackColumns, {
      href: sitePath('/places'),
      label: dict.nav.places,
      newTab: false,
    }),
    ...(cmsColumns.length && !hasCompanyColumn && !hasAbout
      ? [
          {
            heading: dict.footer.company,
            links: [
              { href: sitePath('/about'), label: dict.footer.aboutUs, newTab: false },
              sitemapLink,
            ],
          },
        ]
      : []),
    {
      heading: dict.footer.legalPages,
      links: [
        ...legalLinks,
        ...fallbackLegalLinks.filter(
          (fallback) => !legalLinks.some((link) => link.href === fallback.href),
        ),
      ],
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
  return (
    <footer className="hg-footer" aria-label={dict.footer.label}>
      {/* About + social chips on the left, link columns on the right. The row lives
          in `container-content`, so the About column starts on the same line the
          "Plan your trip" box section above it does. */}
      <div className="container-content grid gap-12 pt-12 md:pt-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5 xl:col-span-4">
          <h3 className="hg-footer__heading">{dict.footer.about}</h3>
          <p className="hg-footer__description mt-4 max-w-[34ch] leading-relaxed text-mist/80">
            {introduction}
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
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
          className={`grid grid-cols-1 gap-x-8 gap-y-10 xs:grid-cols-2 sm:grid-cols-3 lg:col-span-7 lg:gap-x-6 xl:col-span-8 ${tracks}`}
        >
          {rightColumns.map((column) => (
            <FooterColumnBlock
              key={column.heading}
              column={column}
              publishedPageSlugs={publishedPageSlugs}
            />
          ))}
        </div>
      </div>

      {/* Copyright left, creator credit right, pinned to the very bottom — on the
          same content column as the row above. */}
      <div className="container-content mt-16 flex flex-col gap-3 border-t border-haze/20 pt-8 pb-6 sm:flex-row sm:items-center sm:justify-between md:mt-24">
        <p className="text-label leading-snug text-mist/70">{copyright}</p>
        <p className="flex items-center gap-1.5 text-label leading-snug text-mist/70">
          Made with{' '}
          <svg
            className="hg-footer__mark"
            width="11"
            height="10"
            viewBox="0 0 12 11"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M6 10S1 6.9 1 3.9A2.9 2.9 0 0 1 6 2.2 2.9 2.9 0 0 1 11 3.9C11 6.9 6 10 6 10Z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>{' '}
          by{' '}
          <a
            href="https://growlithacademy.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Growlith Academy
          </a>
        </p>
      </div>
    </footer>
  )
}
