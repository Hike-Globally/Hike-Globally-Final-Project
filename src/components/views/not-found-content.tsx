import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'

/**
 * The 404 body, shared by the two places Next renders one.
 *
 *  - `src/app/(frontend)/not-found.tsx` catches a URL that matched a route and then resolved to
 *    nothing (`/typo` hits the `[slug]` catch-all, which calls `notFound()`).
 *  - `src/app/global-not-found.tsx` catches a URL that matched no route at all
 *    (`/trips/old-slug/extra`), where Next renders its own document.
 *
 * One component means both dead ends offer the same copy and the same way back.
 */
export function NotFoundContent() {
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
