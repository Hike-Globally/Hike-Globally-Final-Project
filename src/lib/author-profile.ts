import { sitePath } from '@/i18n/config'
import type { User } from '@/payload-types'

import { httpUrl } from './http-url'

/**
 * Deliberately excludes the account's email, roles and authentication fields.
 *
 * `slug` is included because it is the public profile page's URL segment — an address, not a
 * private fact — and `personJsonLd()` needs it to point the Person node at the page on this site
 * that is actually about the author, rather than at an external homepage.
 */
export type PublicAuthor = Omit<
  Pick<
    User,
    | 'slug'
    | 'name'
    | 'bio'
    | 'avatar'
    | 'jobTitle'
    | 'education'
    | 'credentials'
    | 'website'
    | 'socials'
  >,
  'slug'
> & {
  /**
   * Optional so a partly-populated relationship (or a test fixture with only a name) still
   * typechecks — `authorPath()` simply returns null and nothing links anywhere.
   */
  slug?: string | null
}

/** `/authors/<slug>` for a populated author, or null when there is no address to link to. */
export const authorPath = (
  author: Pick<PublicAuthor, 'slug'> | number | null | undefined,
): string | null => {
  if (!author || typeof author === 'number') return null
  const slug = author.slug?.trim()
  return slug ? sitePath(`/authors/${slug}`) : null
}

/** Shared normalization keeps visible attribution and Person structured data in sync. */
export function authorProfile(author: PublicAuthor | number | null | undefined) {
  if (!author || typeof author === 'number' || !author.name?.trim()) return null

  const seen = new Set<string>()
  const socials = (author.socials ?? []).flatMap((social) => {
    const url = httpUrl(social?.url)
    if (!url || seen.has(url)) return []
    seen.add(url)
    return [{ platform: social.platform, url }]
  })
  const avatar =
    author.avatar &&
    typeof author.avatar !== 'number' &&
    author.avatar.url &&
    !author.avatar.mimeType?.startsWith('video/')
      ? author.avatar
      : undefined

  return {
    slug: author.slug?.trim() || undefined,
    name: author.name.trim(),
    bio: author.bio?.trim() || undefined,
    avatar,
    jobTitle: author.jobTitle?.trim() || undefined,
    education: author.education?.trim() || undefined,
    credentials: [
      ...new Set(
        (author.credentials ?? [])
          .map((row) => row?.credential?.trim())
          .filter((credential): credential is string => Boolean(credential)),
      ),
    ],
    website: httpUrl(author.website),
    socials,
  }
}

/**
 * True when an author deserves an indexed landing page.
 *
 * Every account gets a page — a bare account is still an address a byline can link to, and one an
 * editor may fill in later. But a page with no bio and no published work has nothing to say, so it
 * is kept out of the sitemap and marked `noindex`: indexing it would add a thin URL rather than an
 * asset. The moment the author writes a bio or publishes a post or a trip, the page becomes
 * indexable on its own.
 */
export const isIndexableAuthor = (
  author: PublicAuthor | number | null | undefined,
  work: { posts?: number; trips?: number } = {},
): boolean => Boolean(authorProfile(author)?.bio) || (work.posts ?? 0) > 0 || (work.trips ?? 0) > 0
