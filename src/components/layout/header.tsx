import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './language-switcher'
import { Logo } from './logo'
import { MobileNav, type NavLink } from './mobile-nav'
import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'
import { localizedPath } from '@/i18n/config'
import { getHeader, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

/**
 * Site header — rendered on the server from the `header` and `settings` globals,
 * so navigation is editable in Payload and still ships zero client JavaScript
 * (only the mobile sheet and the language dropdown hydrate).
 */
export async function Header({ locale }: { locale: Locale }) {
  const [header, settings, dict] = [await getHeader(locale), await getSettings(locale), getDictionary(locale)]

  const links: NavLink[] = (header.navItems ?? [])
    .map((item) => resolveLink(item.link, locale))
    .filter((link): link is NavLink => link !== null)

  const actions: NavLink[] = (header.actions ?? [])
    .map((item) => resolveLink(item.link, locale))
    .filter((link): link is NavLink => link !== null)

  const fallbackActions: NavLink[] = actions.length
    ? actions
    : [{ href: localizedPath(locale, '/inquiry'), label: dict.nav.inquiry, newTab: false }]

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
          <Logo
            locale={locale}
            name={settings.siteName}
            logo={settings.logo}
            tagline={settings.tagline}
          />

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
            <LanguageSwitcher current={locale} className="hidden sm:inline-flex" />
            {fallbackActions.slice(0, 1).map((action) => (
              <Button key={action.href} asChild className="hidden sm:inline-flex">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
            <MobileNav
              locale={locale}
              links={links}
              actions={fallbackActions}
              label={dict.common.menu}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
