import type { Metadata } from 'next'
import localFont from 'next/font/local'

import '@fontsource-variable/inter'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'

import '@/app/(frontend)/globals.css'
import '@/app/(frontend)/trips/trip-page.css'

/* The two families the site actually uses for copy — self-hosted from the repo's
   own node_modules, exactly as src/app/(frontend)/layout.tsx does. */
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

export const metadata: Metadata = {
  title: 'Trip page preview · Hike Globally',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body>{children}</body>
    </html>
  )
}
