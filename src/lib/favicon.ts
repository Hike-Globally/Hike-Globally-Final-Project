import type { Metadata } from 'next'

/**
 * Shared by the public layout and Payload's admin metadata. Payload supplies its own default
 * icons, so setting only the frontend favicon would leave the CMS branded as Payload.
 * The ICO also lives at the conventional /favicon.ico URL for clients that request it directly.
 *
 * `icon-192.png` is there for **Google Search**, which shows a favicon beside every result and
 * asks for a square icon whose size is a multiple of 48px (the 16/32/48 ICO and the 180px Apple
 * icon suit browsers and iOS but miss that rule). It is the same mark as `favicon.svg`, rendered
 * from it at 192px, so there is still one piece of artwork.
 */
export const faviconIcons = {
  icon: [
    { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    { url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
    { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
  ],
  apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
} satisfies Metadata['icons']
