import type { MetadataRoute } from 'next'

import { getSettings } from '@/lib/data'

/**
 * /manifest.webmanifest, Next's manifest file convention.
 *
 * The site is not a PWA and this does not make it one: it exists so a browser that offers to
 * install or pin the site gets the real name, the brand colours and a proper icon instead of
 * guessing from the favicon. Values come from the CMS settings global, with the same defaults the
 * layouts use, so renaming the site in the admin renames it here too.
 *
 * The two PNGs are generated from `public/images/logo.svg` and sit at
 * `public/icons/icon-192.png` and `public/icons/icon-512.png`. `theme_color` matches the
 * `viewport` export in `src/app/(frontend)/layout.tsx`.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings()

  return {
    name: settings.siteName,
    short_name: settings.siteName,
    description: settings.tagline ?? undefined,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f8f9fa',
    theme_color: '#183144',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}
