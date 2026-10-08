import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { LivePreviewRefresh } from '@/components/live-preview-refresh'
import { SmoothScroll } from '@/components/providers/smooth-scroll'
import { dictionary } from '@/i18n/dictionaries'
import { htmlLang } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import { absoluteUrl } from '@/lib/seo'
import { resolveSiteUrlObject } from '@/lib/site-url'
import './globals.css'

/**
 * Fonts are self-hosted from node_modules (@fontsource) instead of fetched from
 * fonts.googleapis.com. Next preloads them, generates a size-adjusted fallback metric, and
 * serves them from your own domain — which removes two third-party connections from the
 * critical path and eliminates the flash of unstyled text.
 */
const headingFont = localFont({
  src: '../../../node_modules/@fontsource-variable/google-sans-flex/files/google-sans-flex-latin-wght-normal.woff2',
  variable: '--font-google-sans-flex',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

const bodyFont = localFont({
  src: '../../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2',
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return {
    // `undefined` rather than a thrown `TypeError` if the configured URL is unusable — a bad env
    // var must degrade the metadata, not fail the build.
    metadataBase: resolveSiteUrlObject(),
    title: {
      default: `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.tagline ?? undefined,
    applicationName: settings.siteName,
    formatDetection: { telephone: false },
    other: {
      'theme-color': '#01161e',
    },
    alternates: {
      canonical: absoluteUrl('/'),
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#01161e',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dict = dictionary

  return (
    <html lang={htmlLang} className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="flex min-h-screen flex-col bg-background text-foreground">
        <LivePreviewRefresh />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-deep focus:px-5 focus:py-3 focus:text-mist"
        >
          {dict.common.skipToContent}
        </a>

        <Header />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer />

        {/* Lenis smooth scrolling — ~6KB, disabled for reduced-motion users. */}
        <SmoothScroll />

        <Analytics />
      </body>
    </html>
  )
}
