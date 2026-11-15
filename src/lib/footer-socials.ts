import type { Setting } from '@/payload-types'

/**
 * Which social chips the global footer shows.
 *
 * The row is driven by the `settings` global, but the footer does not print that list verbatim:
 *   • a YouTube row is dropped — the brand does not run the channel;
 *   • a LinkedIn row is shown as X, pointing at `https://x.com/hikeglobally`. X replaced
 *     LinkedIn as the brand's third channel, so a row saved in the CMS before the switch must
 *     not keep the old mark — or its old `linkedin.com` URL — on the page;
 *   • platforms are de-duplicated, because the mapping above can collide with an X row an editor
 *     already added, and each chip is keyed on its platform;
 *   • with nothing usable stored — or a database that has not been seeded — the three channels
 *     the footer is designed around are rendered rather than no icons at all.
 */

export type FooterSocial = NonNullable<Setting['socials']>[number]

/** The X profile a LinkedIn row is rewritten to, and the footer's own X chip. */
export const X_PROFILE = { platform: 'x', url: 'https://x.com/hikeglobally' } as const

/** Rendered when the CMS has no social row worth showing. */
export const FOOTER_SOCIAL_FALLBACK: FooterSocial[] = [
  { platform: 'facebook', url: 'https://facebook.com/hikeglobally' },
  { platform: 'instagram', url: 'https://instagram.com/hikeglobally' },
  { ...X_PROFILE },
]

export const footerSocials = (stored: Setting['socials']): FooterSocial[] => {
  const fromCms = (stored ?? [])
    .filter((social) => social.platform !== 'youtube')
    .map((social) => (social.platform === 'linkedin' ? { ...X_PROFILE } : social))

  const seen = new Set<string>()
  const unique = fromCms.filter((social) => {
    if (seen.has(social.platform)) return false
    seen.add(social.platform)
    return true
  })

  return unique.length ? unique : FOOTER_SOCIAL_FALLBACK
}
