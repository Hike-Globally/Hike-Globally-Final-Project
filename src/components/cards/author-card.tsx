import Link from 'next/link'

import { PayloadImage } from '@/components/ui/payload-image'
import { dictionary } from '@/i18n/dictionaries'
import { authorProfile } from '@/lib/author-profile'
import type { AuthorProfileRecord } from '@/lib/data'
import { sitePath } from '@/i18n/config'
import { cn } from '@/lib/utils'

/**
 * One author on the `/authors` index: portrait, name, role, and a line of bio.
 *
 * The whole card is one link target (the portrait and the name), so a visitor — or a crawler
 * reading the index as a hub — reaches the profile page from either.
 */
export function AuthorCard({
  author,
  className,
}: {
  author: AuthorProfileRecord
  className?: string
}) {
  const dict = dictionary.authors
  const profile = authorProfile(author)
  if (!profile?.slug) return null

  const href = sitePath(`/authors/${profile.slug}`)

  return (
    <article className={cn('group flex h-full flex-col', className)}>
      <Link href={href} className="photo-plate relative block aspect-[4/5] overflow-hidden">
        {profile.avatar ? (
          <PayloadImage
            media={profile.avatar}
            alt={dict.portrait.replace('{name}', profile.name)}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 92vw"
            className="h-full w-full"
            imageClassName="transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        ) : (
          // No portrait: a quiet monogram plate, so the grid keeps its rhythm without
          // pretending to show a face that was never uploaded.
          <span
            aria-hidden="true"
            className="grid h-full w-full place-items-center bg-mist font-heading text-[clamp(3rem,8vw,6rem)] font-semibold text-ink/20"
          >
            {profile.name.slice(0, 1)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-5">
        <h2 className="font-heading text-subhead font-semibold text-ink">
          <Link href={href} className="transition-colors hover:text-deep-90">
            {profile.name}
          </Link>
        </h2>
        {profile.jobTitle ? (
          <p className="mt-1 text-ui font-medium text-ink-80">{profile.jobTitle}</p>
        ) : null}
        {profile.bio ? (
          <p className="mt-3 line-clamp-3 card-description-copy leading-relaxed text-ink-60">
            {profile.bio}
          </p>
        ) : null}
      </div>
    </article>
  )
}
