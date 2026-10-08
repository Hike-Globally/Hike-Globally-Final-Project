import Link from 'next/link'

import { Logo } from './logo'
import { Separator } from '@/components/ui/separator'
import { dictionary } from '@/i18n/dictionaries'
import { getFooter, getSettings } from '@/lib/data'
import { resolveLink } from '@/lib/links'

const isExternal = (href: string) =>
  href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')

export async function Footer() {
  const [footer, settings, dict] = [await getFooter(), await getSettings(), dictionary]

  const copyright = (
    footer.copyright || `© {year} ${settings.siteName}. ${dict.footer.rights}.`
  ).replace('{year}', String(new Date().getFullYear()))

  return (
    <footer className="mt-24 bg-ink text-mist">
      <div className="container-content py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Logo
              name={settings.siteName}
              logo={settings.logo}
              tagline={settings.tagline}
              variant="light"
            />
            {footer.introduction ? (
              <p className="mt-6 text-[0.9375rem] leading-relaxed text-mist/70">
                {footer.introduction}
              </p>
            ) : null}

            <div className="mt-8 space-y-2 text-[0.9375rem] text-mist/80">
              {settings.email ? (
                <p>
                  <a
                    href={`mailto:${settings.email}`}
                    className="transition-colors hover:text-sage"
                  >
                    {settings.email}
                  </a>
                </p>
              ) : null}
              {settings.phone ? (
                <p>
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                    className="transition-colors hover:text-sage"
                  >
                    {settings.phone}
                  </a>
                </p>
              ) : null}
              {settings.address ? (
                <p className="whitespace-pre-line text-mist/60">{settings.address}</p>
              ) : null}
            </div>

            {settings.socials?.length ? (
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] tracking-wide text-mist/70 uppercase">
                {settings.socials.map((social) => (
                  <li key={`${social.platform}-${social.url}`}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-colors hover:text-sage"
                    >
                      {social.platform}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {footer.columns?.map((column) => {
              const links = (column.links ?? [])
                .map((item) => resolveLink(item.link))
                .filter(Boolean)

              return (
                <div key={column.id ?? column.heading}>
                  <h2 className="eyebrow mb-5 text-mist/50">{column.heading}</h2>
                  <ul className="space-y-3">
                    {links.map((link) => (
                      <li key={`${link!.href}-${link!.label}`}>
                        <Link
                          href={link!.href}
                          className="text-[0.9375rem] text-mist/80 transition-colors hover:text-sage"
                        >
                          {link!.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        <Separator className="my-10 bg-white/10" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.8125rem] text-mist/50">{copyright}</p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {footer.legalLinks?.map((item) => {
              const link = resolveLink(item.link)
              if (!link) return null
              return (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  target={link.newTab ? '_blank' : undefined}
                  rel={isExternal(link.href) ? 'noopener noreferrer' : undefined}
                  className="text-[0.8125rem] text-mist/50 transition-colors hover:text-sage"
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
