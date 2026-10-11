import type { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'

/**
 * A 404 is served at a URL that does not exist, so it is the one place the site deliberately
 * emits **no** canonical: the layout's pathname-based fallback would otherwise point the tag at
 * the missing URL itself. Declaring `alternates` here replaces what the layout provides (Next
 * swaps the whole `alternates` block rather than merging it), and `canonical: undefined` means no
 * `<link rel="canonical">` is rendered at all. `noindex` keeps the response out of the index even
 * if something links to it heavily.
 */
export const metadata: Metadata = {
  title: dictionary.notFound.title,
  description: dictionary.notFound.text,
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
}

export default function NotFound() {
  const dict = dictionary

  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-36">
      <div className="container-prose text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="heading-lg">{dict.notFound.title}</h1>
        <p className="lead mx-auto mt-4 max-w-xl">{dict.notFound.text}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={sitePath('/')}>{dict.notFound.home}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={sitePath('/trips')}>{dict.notFound.trips}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
