import type { Metadata } from 'next'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { NotFoundContent } from '@/components/views/not-found-content'
import { htmlLang } from '@/i18n/config'
import { dictionary } from '@/i18n/dictionaries'
import { bodyFont, displayFont } from '@/lib/fonts'

import './(frontend)/globals.css'

/**
 * The 404 for a URL that matches no route at all.
 *
 * Next renders this document instead of a route, so it owns `<html>` and has to load the fonts
 * and the stylesheet itself. Without it, `/trips/everest-base-camp/2020` (two segments past a
 * route) fell through to Next's bare "This page could not be found" page: status 404, but no
 * header, no footer and nowhere to go. The `[slug]` catch-all only covers single-segment misses,
 * which `src/app/(frontend)/not-found.tsx` handles.
 *
 * Deliberately does not set `robots` in its metadata: Next already emits `<meta name="robots"
 * content="noindex">` for a not-found document, and declaring it again produced two tags.
 */
export const metadata: Metadata = {
  title: dictionary.notFound.title,
  description: dictionary.notFound.text,
}

export default function GlobalNotFound() {
  return (
    <html
      lang={htmlLang}
      className={`${displayFont.variable} ${bodyFont.variable} overflow-x-clip`}
    >
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background text-foreground">
        <Header />

        <main id="main" className="w-full min-w-0 flex-1 overflow-x-clip">
          <NotFoundContent />
        </main>

        <Footer />
      </body>
    </html>
  )
}
