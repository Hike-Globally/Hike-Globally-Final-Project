import type { Metadata } from 'next'
import Link from 'next/link'
import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const dict = dictionary

  return buildMetadata({
    title: dict.inquiry.successTitle,
    path: sitePath('/inquiry/thank-you'),
    noIndex: true,
  })
}

/** Where Formsubmit.co redirects after a successful enquiry (the `_next` hidden field). */
export default async function ThankYouPage() {
  const dict = dictionary

  return (
    <section className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="container-prose text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-sage-90 text-white">
          <Check className="size-6" strokeWidth={3} aria-hidden />
        </span>
        <h1 className="heading-lg mt-8">{dict.inquiry.successTitle}</h1>
        <p className="lead mx-auto mt-4 max-w-xl">{dict.inquiry.successText}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={sitePath('/trips')}>{dict.inquiry.successBrowseTrips}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={sitePath('/')}>{dict.inquiry.successBackHome}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
