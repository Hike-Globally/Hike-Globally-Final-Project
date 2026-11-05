import type { Metadata } from 'next'

import { NotFoundContent } from '@/components/views/not-found-content'
import { dictionary } from '@/i18n/dictionaries'

/**
 * A 404 is served at a URL that does not exist, so it is the one place the site deliberately
 * emits **no** canonical: the layout's pathname-based fallback would otherwise point the tag at
 * the missing URL itself. Declaring `alternates` here replaces what the layout provides (Next
 * swaps the whole `alternates` block rather than merging it), and `canonical: undefined` means no
 * `<link rel="canonical">` is rendered at all. `noindex` keeps the response out of the index even
 * if something links to it heavily.
 *
 * Next also emits its own `noindex` for a not-found document, so a 404 carries the directive
 * twice (this one adds `follow`, so the links back to `/` and `/trips` are still followed). Both
 * tags agree, which is what matters: the page is never indexed.
 */
export const metadata: Metadata = {
  title: dictionary.notFound.title,
  description: dictionary.notFound.text,
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
}

export default function NotFound() {
  return <NotFoundContent />
}
