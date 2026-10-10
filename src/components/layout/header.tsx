import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { MobileNav, type NavLink } from './mobile-nav'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { getHeader, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

/**
 * Site header — rendered on the server from the `header` and `settings` globals,
 * so navigation is editable in Payload and still ships zero client JavaScript
 * (only the mobile sheet hydrates).
 */
export async function Header() {
  const [header, settings, dict] = [await getHeader(), await getSettings(), dictionary]

  const configuredLinks: NavLink[] = (header.navItems ?? [])
    .map((item) => resolveLink(item.link))
    .filter((link): link is NavLink => link !== null)

  const links: NavLink[] = configuredLinks.length
    ? configuredLinks
    : [
        { href: sitePath('/trips'), label: dict.nav.trips, newTab: false },
        { href: sitePath('/destinations'), label: dict.nav.destinations, newTab: false },
        { href: sitePath('/blog'), label: dict.nav.blog, newTab: false },
      ]

  const actions: NavLink[] = (header.actions ?? [])
    .map((item) => resolveLink(item.link))
    .filter((link): link is NavLink => link !== null)

  const fallbackActions: NavLink[] = actions.length
    ? actions
    : [{ href: sitePath('/inquiry'), label: dict.nav.inquiry, newTab: false }]

  return (
    <header className="sticky top-0 z-50">
      {header.announcement ? (
        <div className="bg-ink text-mist">
          <p className="container-content py-2 text-center text-[0.8125rem] tracking-wide text-mist/90">
            {header.announcement}
          </p>
        </div>
      ) : null}

      <div className="border-b border-black/[0.06] bg-mist/85 backdrop-blur-md supports-[backdrop-filter]:bg-mist/70">
        <div className="container-content flex h-[4.5rem] items-center justify-between gap-6">
          <Logo name={settings.siteName} tagline={settings.tagline} />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-ink-80 transition-colors hover:text-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {fallbackActions.slice(0, 1).map((action) => (
              <Button key={action.href} asChild className="hidden sm:inline-flex">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
            <MobileNav links={links} actions={fallbackActions} label={dict.common.menu} />
          </div>
        </div>
      </div>
    </header>
  )
}
