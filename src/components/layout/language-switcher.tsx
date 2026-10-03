'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Check, Languages } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { locales, localeMeta, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

/**
 * Language switcher.
 *
 * It swaps ONLY the locale segment of the current URL, so switching language from
 * /de/trips/everest-base-camp-trek keeps you on the same page in the new language
 * (each content slug is localized in Payload, so the correct translated slug is used).
 */
export function LanguageSwitcher({
  current,
  className,
  variant = 'header',
}: {
  current: Locale
  className?: string
  variant?: 'header' | 'footer'
}) {
  const pathname = usePathname() || '/'

  const pathFor = (locale: Locale): string => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return `/${locale}`
    // Replace the current locale segment, keep everything after it as-is.
    segments[0] = locale
    return `/${segments.join('/')}`
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors outline-none',
          variant === 'header'
            ? 'text-ink hover:bg-mist-60'
            : 'border border-white/15 text-white/80 hover:bg-white/10',
          className,
        )}
        aria-label="Change language"
      >
        <Languages className="size-4" />
        <span className="font-medium">{localeMeta[current].shortLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {locales.map((locale) => (
          <DropdownMenuItem key={locale} asChild>
            <Link href={pathFor(locale)} hrefLang={localeMeta[locale].htmlLang} className="justify-between">
              <span>{localeMeta[locale].label}</span>
              {locale === current && <Check className="size-4 text-deep" />}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
