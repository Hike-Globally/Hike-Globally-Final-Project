import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/dictionaries'
import { isLocale, localizedPath, type Locale } from '@/i18n/config'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  const dict = getDictionary(locale)

  return buildMetadata({
    title: dict.inquiry.successTitle,
    path: localizedPath(locale, '/inquiry/thank-you'),
    locale,
    noIndex: true,
  })
}

/** Where Formsubmit.co redirects after a successful enquiry (the `_next` hidden field). */
export default async function ThankYouPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()

  const locale = localeParam as Locale
  const dict = getDictionary(locale)

  return (
    <section className="py-24 md:py-32">
      <div className="container-prose text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-sage/70 text-ink">
          <Check className="size-6" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="heading-lg mt-8">{dict.inquiry.successTitle}</h1>
        <p className="lead mx-auto mt-4 max-w-xl">{dict.inquiry.successText}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={localizedPath(locale, '/trips')}>{dict.inquiry.successBrowseTrips}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={localizedPath(locale, '/')}>{dict.inquiry.successBackHome}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
