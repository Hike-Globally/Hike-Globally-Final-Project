import type { Metadata } from 'next'

/**
 * Shared by the public layout and Payload's admin metadata. Payload supplies its own default
 * icons, so setting only the frontend favicon would leave the CMS branded as Payload.
 * The ICO also lives at the conventional /favicon.ico URL for clients that request it directly.
 */
export const faviconIcons = {
  icon: [
    { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
    { url: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
  ],
  apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
} satisfies Metadata['icons']
