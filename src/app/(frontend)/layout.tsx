import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { LivePreviewRefresh } from '@/components/live-preview-refresh'
import { SmoothScroll } from '@/components/providers/smooth-scroll'
import { dictionary } from '@/i18n/dictionaries'
import { htmlLang, ogLocale } from '@/i18n/config'
import { getSettings } from '@/lib/data'
import { bodyFont, displayFont } from '@/lib/fonts'
import { imageUrl } from '@/lib/seo'
import { resolveSiteUrlObject } from '@/lib/site-url'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  // `undefined` rather than a thrown `TypeError` if the configured origin is unusable — a bad env
  // var must degrade the metadata, not fail the build.
  const siteUrlObject = resolveSiteUrlObject()

  // Absolute URL of the fallback share image, when the site settings define one.
  const defaultOgImage = imageUrl(settings.defaultOgImage)

  return {
    metadataBase: siteUrlObject,
    title: {
      default: `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
      template: `%s · ${settings.siteName}`,
    },
    description: settings.tagline ?? undefined,
    applicationName: settings.siteName,
    /**
     * Site-wide Open Graph / Twitter defaults.
     *
     * Every route that exports its own `generateMetadata` replaces these with a complete block
     * (see `buildMetadata()`), so this is the safety net underneath them: a page that forgets, or
     * one that deliberately returns `{}` for a reserved slug, still shares with the site name,
     * locale and the default 1200×630 image instead of a bare title.
     */
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      locale: ogLocale,
      title: `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
      description: settings.tagline ?? undefined,
      images: defaultOgImage ? [{ url: defaultOgImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${settings.siteName} — ${settings.tagline ?? 'Trekking & expeditions in Nepal'}`,
      description: settings.tagline ?? undefined,
      images: defaultOgImage ? [defaultOgImage] : undefined,
    },
    icons: { icon: '/images/logo.svg', apple: '/apple-touch-icon.png' },
    formatDetection: { telephone: false },
    alternates: {
      /**
       * Site-wide canonical fallback: the exact URL of whatever page is being rendered.
       *
       * Passing a `URL` *instance* (not a string) is Next.js' own mechanism for this — Next
       * resolves it against the request's pathname, so `/trips/everest-base-camp` canonicalizes to
       * `https://hikeglobally.com/trips/everest-base-camp` with no code in that route. A page's own
       * `buildMetadata({ path })` overrides it with the identical value; this net exists so a route
       * added later that forgets `generateMetadata` still self-canonicalizes correctly instead of
       * silently inheriting a homepage canonical (which would tell Google it is a duplicate of `/`).
       *
       * With an unusable origin this is `undefined` and no canonical is emitted at all — better
       * than a wrong one.
       */
      canonical: siteUrlObject,
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#183144',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const dict = dictionary

  return (
    <html
      lang={htmlLang}
      className={`${displayFont.variable} ${bodyFont.variable} overflow-x-clip`}
    >
      {/* Google tag (gtag.js) & Google AdSense — verbatim from gtag.txt and ads.txt at the repo
          root. This root layout wraps every public page, so placing the snippets inside <head> is
          the Next.js equivalent of pasting them between <head></head> of each page. */}
      <head>
        {/* Google tag (gtag.js) */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga -- gtag.txt is pasted verbatim as requested, rather than the @next/third-parties wrapper */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-WWQBTLKKBW"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-WWQBTLKKBW');
`,
          }}
        ></script>
        {/* Google AdSense (from ads.txt) */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2988608851561676"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="flex min-h-dvh min-w-0 flex-col overflow-x-clip bg-background text-foreground">
        <LivePreviewRefresh />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-ink focus:px-5 focus:py-3 focus:text-white"
        >
          {dict.common.skipToContent}
        </a>

        <Header />

        <main id="main" className="w-full min-w-0 flex-1 overflow-x-clip">
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
