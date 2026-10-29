import { HeaderFrame } from './header-frame'
import { PillNav, type PillNavLink } from './pill-nav'
import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { getHeader, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

/**
 * Site header — the pill dropdown nav ported from `Header-Sample.html`,
 * rendered once from the root layout so it is the global, sitewide header.
 *
 * Navigation still comes from the `header` + `settings` Payload globals:
 *   • navItems        → tabs (with optional `children` → dropdown panel)
 *   • actions[0]      → the white CTA pill at the right of the track
 *   • announcement    → slim floating bar above the track
 *   • settings.siteName → the wordmark slot at the left of the track
 */
export async function Header() {
  const [header, settings] = await Promise.all([getHeader(), getSettings()])
  const dict = dictionary

  const links: PillNavLink[] = (header.navItems ?? []).flatMap((item) => {
    const link = resolveLink(item.link)
    if (!link) return []
    const children = (item.children ?? [])
      .map((child) => resolveLink(child.link))
      .filter((child): child is NonNullable<typeof child> => child !== null)
    return [{ ...link, children }]
  })

  const fallbackLinks: PillNavLink[] = links.length
    ? links
    : [
        { href: sitePath('/trips'), label: dict.nav.trips, newTab: false, children: [] },
        {
          href: sitePath('/destinations'),
          label: dict.nav.destinations,
          newTab: false,
          children: [],
        },
        { href: sitePath('/blog'), label: dict.nav.blog, newTab: false, children: [] },
      ]

  const actions = (header.actions ?? [])
    .map((item) => resolveLink(item.link))
    .filter((link): link is PillNavLink => link !== null)

  const cta: PillNavLink | null =
    actions[0] ?? { href: sitePath('/inquiry'), label: dict.nav.inquiry, newTab: false }

  return (
    <HeaderFrame>
      {header.announcement ? (
        <div className="container-content flex justify-start pt-2.5">
          <p className="pn-announcement">{header.announcement}</p>
        </div>
      ) : null}

      <PillNav
        logoLabel={settings.siteName}
        logoHref={sitePath('/')}
        links={fallbackLinks}
        cta={cta}
      />
    </HeaderFrame>
  )
}
