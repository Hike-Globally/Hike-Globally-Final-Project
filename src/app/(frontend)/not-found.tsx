import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'

export default function NotFound() {
  const dict = dictionary

  return (
    <section className="py-28 md:py-36">
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
