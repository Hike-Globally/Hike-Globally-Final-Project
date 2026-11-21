'use client'

import { frontendLocaleMeta, frontendLocales } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { setFrontendLocale, useFrontendLocale } from '@/i18n/frontend-locale'

/**
 * Compact EN / DE / FR switcher. It only writes the frontend locale cookie and
 * notifies the translation runtime — links, routes and canonical URLs are
 * deliberately left untouched.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useFrontendLocale()
  const label = getDictionary(locale).common.language

  return (
    <div
      className={`fixed bottom-4 right-4 z-[60] flex items-center gap-1 rounded-full border border-white/15 bg-ink/95 p-1 text-label text-mist shadow-lg backdrop-blur-sm ${className}`}
      data-frontend-locale-switcher
      data-no-i18n
      role="group"
      aria-label={label}
      title={label}
    >
      <span className="sr-only">{label}</span>
      {frontendLocales.map((code) => {
        const active = code === locale
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            aria-label={frontendLocaleMeta[code].label}
            title={frontendLocaleMeta[code].label}
            onClick={() => setFrontendLocale(code)}
            className={`min-w-9 rounded-full px-2.5 py-1.5 font-medium tracking-[0.06em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mist ${
              active ? 'bg-paper text-ink' : 'text-mist hover:bg-white/10'
            }`}
          >
            {frontendLocaleMeta[code].shortLabel}
          </button>
        )
      })}
    </div>
  )
}
