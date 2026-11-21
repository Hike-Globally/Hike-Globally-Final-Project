import { HeaderFrame } from './header-frame'
import { PillNav, type PillNavLink } from './pill-nav'
import { sitePath } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { getDestinations, getHeader, getSettings, getTrips } from '@/lib/data'
import { resolveLink } from '@/lib/links'
import { buildMegaMenuData } from '@/lib/mega-menu'
import { withPlacesHeaderLink } from '@/lib/places-navigation'

/**
 * Site header — the pill dropdown nav ported from `Header-Sample.html`,
 * rendered once from the root layout so it is the global, sitewide header.
 *
 * Navigation still comes from the `header` + `settings` Payload globals:
 *   • navItems        → tabs (Destinations and Trips automatically open rich
 *                       mega menus fed by published CMS content, while still
 *                       preserving any custom dropdown links an editor adds)
 *   • actions[0]      → the CTA pill at the right of the track
 *   • announcement    → slim floating bar above the track
 *   • settings.siteName → accessible label for the logo at the left of the track
 */
export async function Header() {
  const [header, settings, destinations, trips] = await Promise.all([
    getHeader(),
    getSettings(),
    getDestinations(),
    getTrips(),
  ])
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
    actions[0] ?? { href: sitePath('/contact'), label: dict.nav.inquiry, newTab: false }

  const megaMenu = buildMegaMenuData({ destinations, trips })

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
        links={withPlacesHeaderLink(fallbackLinks, {
          href: sitePath('/places'),
          label: dict.nav.places,
          newTab: false,
          children: [],
        })}
        cta={cta}
        megaMenu={megaMenu}
      />
    </HeaderFrame>
  )
}
