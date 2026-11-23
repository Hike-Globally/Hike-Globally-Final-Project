import Link from 'next/link'

import { PayloadImage } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { authorPath, authorProfile, type PublicAuthor } from '@/lib/author-profile'
import { cn } from '@/lib/utils'

/** Platform display names, shared with the author detail page's profile links. */
export const platformLabels = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
} as const

/** The same public facts used by personJsonLd(), even when the bio is still empty. */
export function AuthorProfile({
  author,
  label,
  className,
}: {
  author: PublicAuthor | number | null | undefined
  label: string
  className?: string
}) {
  const profile = authorProfile(author)
  if (!profile) return null
  // The byline leads to the author's page on this site when there is one — that is the internal
  // link E-E-A-T actually needs — and only falls back to an external profile for a user with no
  // slug (an account created before the profile pages existed, or one never edited since).
  const internalUrl = authorPath(author)
  const externalUrl = profile.website ?? profile.socials[0]?.url
  const dict = dictionary.author

  return (
    <section
      aria-label={label}
      data-author-profile=""
      className={cn('mt-16 flex items-start gap-4 border-t border-slate-20 pt-7', className)}
    >
      {profile.avatar ? (
        <PayloadImage
          media={profile.avatar}
          alt={profile.name}
          sizes="64px"
          className="size-16 shrink-0 rounded-full ring-1 ring-slate-20"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-16 shrink-0 place-items-center rounded-full bg-mist font-heading text-subhead font-semibold text-ink"
        >
          {profile.name.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 pt-1">
        <p className="eyebrow text-slate-80">{label}</p>
        <h2 className="mt-1 font-heading text-subhead font-semibold text-ink">
          {internalUrl ? (
            <Link href={internalUrl} rel="author" className="underline-offset-4 hover:underline">
              {profile.name}
            </Link>
          ) : externalUrl ? (
            <a href={externalUrl} rel="author" className="underline-offset-4 hover:underline">
              {profile.name}
            </a>
          ) : (
            profile.name
          )}
        </h2>
        {profile.jobTitle ? (
          <p className="mt-1 text-ui font-medium text-ink-80">{profile.jobTitle}</p>
        ) : null}
        {profile.bio ? (
          <p className="mt-2 description-copy leading-relaxed text-ink-60">{profile.bio}</p>
        ) : null}
        {profile.education ? (
          <p className="mt-3 description-copy leading-relaxed text-ink-60">
            <span className="font-medium text-ink-80">{dict.education}: </span>
            {profile.education}
          </p>
        ) : null}
        {profile.credentials.length ? (
          <div className="mt-3 description-copy leading-relaxed text-ink-60">
            <p className="font-medium text-ink-80">{dict.credentials}</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {profile.credentials.map((credential) => (
                <li key={credential}>{credential}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {profile.website || profile.socials.length ? (
          <ul aria-label={dict.profiles} className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-small">
            {profile.website ? (
              <li>
                <a
                  href={profile.website}
                  rel="author"
                  className="text-deep underline underline-offset-4"
                >
                  {dict.website}
                </a>
              </li>
            ) : null}
            {profile.socials.map((social) => (
              <li key={social.url}>
                <a href={social.url} rel="me" className="text-deep underline underline-offset-4">
                  {platformLabels[social.platform] ?? social.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
