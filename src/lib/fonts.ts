import localFont from 'next/font/local'

/**
 * The site's two typefaces, defined once and imported by every root layout.
 *
 * Two roots render the storefront: `src/app/(frontend)/layout.tsx` for the site itself, and
 * `src/app/global-not-found.tsx`, which Next renders with its own `<html>` for a URL that matches
 * no route at all. Sharing the definitions here keeps that 404 in the same type as every other
 * page instead of duplicating the font configuration (and drifting from it).
 *
 * Both faces are self-hosted from node_modules (@fontsource) instead of fetched from
 * fonts.googleapis.com:
 *
 *   · Archivo (variable)     — body copy, sub-headings, eyebrows, navigation, buttons
 *   · Instrument Serif       — display tier: hero, section and page headlines,
 *                              pull quotes, oversized numerals (plus the italic
 *                              accent line an editor writes with `<i>…</i>`)
 *
 * Next preloads both, generates a size-adjusted fallback metric and serves them from your own
 * domain, which keeps third-party connections off the critical path and eliminates the flash of
 * unstyled text. The display face is preloaded because the hero headline is the LCP element on the
 * homepage.
 */
export const bodyFont = localFont({
  src: '../../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2',
  variable: '--font-archivo',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
})

export const displayFont = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
})
