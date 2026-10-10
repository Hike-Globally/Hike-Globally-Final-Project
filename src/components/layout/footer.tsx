import './footer.css'

import { FooterShader } from './footer-shader'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getFooter, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

/**
 * Global site footer — ported 1:1 from footer-sample.html (first "Desktop"
 * variant of the shader footer): black canvas, giant fit-to-width wordmark,
 * 12-column link grid with masked two-layer hover swaps, small-text bottom
 * bar, and the animated blue shader behind everything.
 *
 * Content is CMS-driven (footer + settings globals):
 *   wordmark   → settings.siteName
 *   about      → footer.introduction
 *   socials    → settings.socials (36×36 outlined icon buttons)
 *   columns    → footer.columns (up to 3), plus an auto "Contact us" column
 *                 (Book a call / email / phone) when there is room
 *   bottom bar → footer.copyright ({year}) + legal links + settings.address
 */

type ResolvedLink = { href: string; label: string; newTab: boolean }

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg width="9" height="17" viewBox="0 0 9.01 17" fill="none" aria-hidden="true">
      <path
        d="M8.419 9.563 8.887 6.486H5.965V4.489c0-.841.408-1.662 1.717-1.662h1.328V.208S7.805 0 6.652 0C4.247 0 2.674 1.474 2.674 4.141v2.345H0v3.077h2.674V17h3.291V9.563Z"
        fill="currentColor"
      />
    </svg>
  ),
  instagram: (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.14 6.86 15.28 0h-1.46L8.5 5.96 4.66 0H0l6.42 9.14L0 16h1.46l5.62-6.3L11.34 16H16L9.14 6.86Zm-2 2.24-.65-.9L1.32 1.02h2.23l4.2 5.86.65.9 5.44 7.6h-2.23l-4.47-6.28Z"
        fill="currentColor"
      />
    </svg>
  ),
  youtube: (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" aria-hidden="true">
      <path
        d="M17.6 2.03a2.1 2.1 0 0 0-1.48-1.49C14.8.2 9 .2 9 .2s-5.8 0-7.12.34A2.1 2.1 0 0 0 .4 2.03 22 22 0 0 0 0 6.5a22 22 0 0 0 .4 4.47 2.1 2.1 0 0 0 1.48 1.49c1.32.34 7.12.34 7.12.34s5.8 0 7.12-.34a2.1 2.1 0 0 0 1.48-1.49A22 22 0 0 0 18 6.5a22 22 0 0 0-.4-4.47ZM7.2 9.06V3.94L11.6 6.5Z"
        fill="currentColor"
      />
    </svg>
  ),
  linkedin: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.6 5.5H0.8V15h2.8V5.5ZM2.2 4.3a1.65 1.65 0 1 0 0-3.3 1.65 1.65 0 0 0 0 3.3ZM15.2 9.9c0-3-1.6-4.6-3.9-4.6a3.4 3.4 0 0 0-3 1.6V5.5H5.5V15h2.8V9.8c0-1.3.6-2.1 1.8-2.1s1.7.8 1.7 2.1V15h2.8V9.9Z"
        fill="currentColor"
      />
    </svg>
  ),
  tiktok: (
    <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
      <path
        d="M10.8 0H8.2v10.6a2.9 2.9 0 1 1-2.4-2.86V5.1a5.5 5.5 0 1 0 5 5.47V5.9a6.3 6.3 0 0 0 3.2.9V4.2a4 4 0 0 1-3.2-4.2Z"
        fill="currentColor"
      />
    </svg>
  ),
}

function HoverLink({ link }: { link: ResolvedLink }) {
  const external = link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {}
  return (
    <a className="hf-link" href={link.href} {...external}>
      <span className="hf-link-wrap" aria-hidden="true">
        <span className="hf-link-text">{link.label}</span>
        <span className="hf-link-text">{link.label}</span>
      </span>
      <span className="hf-link-sizer">{link.label}</span>
      <span className="sr-only">{link.label}</span>
    </a>
  )
}

export async function Footer() {
  const [footer, settings, dict] = [await getFooter(), await getSettings(), dictionary]

  const copyright = (
    footer.copyright || `© {year} ${settings.siteName}. ${dict.footer.rights}.`
  ).replace('{year}', String(new Date().getFullYear()))

  const cmsColumns = (footer.columns ?? [])
    .map((column) => ({
      heading: column.heading ?? '',
      links: (column.links ?? [])
        .map((item) => resolveLink(item.link))
        .filter((link): link is ResolvedLink => link !== null),
    }))
    .filter((column) => column.links.length > 0)

  const contactColumn = {
    heading: dict.footer.contactUs,
    links: [
      { href: sitePath('/inquiry'), label: dict.nav.inquiry, newTab: false },
      ...(settings.email
        ? [{ href: `mailto:${settings.email}`, label: settings.email, newTab: false }]
        : []),
      ...(settings.phone
        ? [
            {
              href: `tel:${settings.phone.replace(/\s+/g, '')}`,
              label: settings.phone,
              newTab: false,
            },
          ]
        : []),
    ],
  }

  const columns =
    cmsColumns.length >= 3
      ? cmsColumns.slice(0, 3)
      : [...cmsColumns, contactColumn].slice(0, 3)

  const legalLinks = (footer.legalLinks ?? [])
    .map((item) => resolveLink(item.link))
    .filter((link): link is ResolvedLink => link !== null)

  const addressLine = settings.address?.split('\n')[0]?.trim() || null
  const socials = settings.socials ?? []

  return (
    <footer className="hf-root">
      <FooterShader />

      <div className="hf-inner">
        <div className="hf-logo">
          <span
            className="hf-wordmark"
            style={{ ['--hf-chars' as string]: String(Math.max(settings.siteName.length, 4)) }}
          >
            {settings.siteName}
          </span>
        </div>

        <div className="hf-content">
          <div className="hf-top">
            <div className="hf-about-container">
              <div className="hf-about">
                <div className="hf-block-title">{dict.footer.about}</div>
                {footer.introduction ? (
                  <p className="hf-intro">{footer.introduction}</p>
                ) : null}
              </div>

              {socials.length ? (
                <ul className="hf-socials">
                  {socials.map((social) => (
                    <li key={`${social.platform}-${social.url}`}>
                      <a
                        className="hf-social"
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.platform}
                      >
                        {SOCIAL_ICONS[social.platform] ?? SOCIAL_ICONS.x}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {columns.map((column) => (
              <div className="hf-column" key={column.heading}>
                <div className="hf-column-title">
                  <span className="hf-block-title">{column.heading}</span>
                </div>
                <ul className="hf-list">
                  {column.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
                      <HoverLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <ul className="hf-bottom">
            <li className="hf-bottom-left">
              <span className="hf-small">{copyright}</span>
            </li>

            {legalLinks.map((link) => (
              <li key={`${link.href}-${link.label}`}>
                <a className="hf-small" href={link.href}>
                  {link.label}
                </a>
              </li>
            ))}

            {addressLine ? (
              <li className="hf-location">
                <span className="hf-pin" aria-hidden="true">
                  <svg width="9" height="12" viewBox="0 0 9 11.999" fill="none">
                    <path
                      d="M5.055 11.729C6.258 10.221 9 6.565 9 4.511 9 2.021 6.984 0 4.5 0 2.016 0 0 2.021 0 4.511c0 2.054 2.742 5.71 3.945 7.218.288.36.822.36 1.11 0ZM4.5 3.008c.828 0 1.5.673 1.5 1.503 0 .831-.672 1.504-1.5 1.504-.828 0-1.5-.673-1.5-1.504 0-.83.672-1.503 1.5-1.503Z"
                      fill="rgb(255, 255, 255)"
                      opacity="0.5"
                    />
                  </svg>
                </span>
                <span className="hf-small">{addressLine}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </footer>
  )
}
