import type { User } from '@/payload-types'

import { httpUrl } from './http-url'

/** Deliberately excludes the account's email, roles and authentication fields. */
export type PublicAuthor = Pick<
  User,
  'name' | 'bio' | 'avatar' | 'jobTitle' | 'education' | 'credentials' | 'website' | 'socials'
>

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
