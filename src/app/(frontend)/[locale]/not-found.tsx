import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { getDictionary } from '@/i18n/dictionaries'
import { defaultLocale, localizedPath } from '@/i18n/config'

export default function NotFound() {
  // A not-found boundary inside a dynamic segment cannot read params, so it renders in the
  // default language. Crawlers never index 404s, and the links below restore the visitor's
  // own language on the next click (the language switcher is available in the header).
  const locale = defaultLocale
  const dict = getDictionary(locale)

  return (
    <section className="py-28 md:py-36">
      <div className="container-prose text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="heading-lg">{dict.notFound.title}</h1>
        <p className="lead mx-auto mt-4 max-w-xl">{dict.notFound.text}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={localizedPath(locale, '/')}>{dict.notFound.home}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={localizedPath(locale, '/trips')}>{dict.notFound.trips}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
