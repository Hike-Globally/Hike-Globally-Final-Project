import { PostCard } from '@/components/cards/post-card'
import { TripCard } from '@/components/cards/trip-card'
import { PageHeader } from '@/components/sections/page-header'
import { PayloadImage } from '@/components/ui/payload-image'
import { platformLabels } from '@/components/content/author-profile'
import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import { authorProfile } from '@/lib/author-profile'
import type {
  AuthorProfileRecord,
  PostCard as PostCardData,
  TripCard as TripCardData,
} from '@/lib/data'

/**
 * `/authors/<slug>` — the landing page for one account.
 *
 * Everything here is server-rendered from the profile document, so the entity is readable without
 * JavaScript and the page carries its own `ProfilePage` + `BreadcrumbList` markup (emitted by the
 * route). The left column is who the person is; the right is what they have published. Both are
 * real links, which is what turns a byline into a crawlable internal link graph.
 */
export function AuthorDetail({
  author,
  posts,
  trips,
}: {
  author: AuthorProfileRecord
  posts: PostCardData[]
  trips: TripCardData[]
}) {
  const dict = dictionary.authors
  const profile = authorProfile(author)
  if (!profile) return null

  const links = [
    ...(profile.website
      ? [{ label: dictionary.author.website, url: profile.website, rel: 'author me' }]
      : []),
    ...profile.socials.map((social) => ({
      label: platformLabels[social.platform] ?? social.platform,
      url: social.url,
      rel: 'me',
    })),
  ]

  return (
    <>
      <PageHeader
        eyebrow={dict.profileEyebrow}
        title={profile.name}
        lead={profile.jobTitle ?? undefined}
        breadcrumbs={[
          { label: dictionary.nav.home, href: sitePath('/') },
          { label: dict.allAuthors, href: sitePath('/authors') },
          { label: profile.name },
        ]}
      />

      <section className="py-12 md:py-20">
        <div className="container-content grid gap-10 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:gap-16">
          {/* ------------------------------------------------------------------ Identity */}
          <aside className="flex flex-col gap-7">
            {profile.avatar ? (
              <PayloadImage
                media={profile.avatar}
                alt={dict.portrait.replace('{name}', profile.name)}
                sizes="(min-width: 1024px) 18rem, 92vw"
                className="aspect-[4/5] w-full"
                imageClassName="object-cover"
              />
            ) : null}

            <div>
              <h2 className="sr-only">{dict.about.replace('{name}', profile.name)}</h2>

              {profile.bio ? (
                <p className="description-copy leading-relaxed text-ink-60">{profile.bio}</p>
              ) : null}

              {profile.education ? (
                <p className="mt-4 description-copy leading-relaxed text-ink-60">
                  <span className="font-medium text-ink-80">{dictionary.author.education}: </span>
                  {profile.education}
                </p>
              ) : null}

              {profile.credentials.length ? (
                <div className="mt-4 description-copy leading-relaxed text-ink-60">
                  <p className="font-medium text-ink-80">{dictionary.author.credentials}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {profile.credentials.map((credential) => (
                      <li key={credential}>{credential}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {links.length ? (
                <ul aria-label={dictionary.author.profiles} className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-small">
                  {links.map((link) => (
                    <li key={`${link.label}-${link.url}`}>
                      <a
                        href={link.url}
                        rel={link.rel}
                        className="text-deep underline underline-offset-4"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </aside>

          {/* ------------------------------------------------------------------ Published work */}
          <div className="min-w-0">
            <section aria-labelledby="author-posts-heading">
              <h2 id="author-posts-heading" className="heading-md text-ink">
                {dict.posts}
              </h2>

              {posts.length ? (
                <div className="mt-6 grid gap-x-8 gap-y-10 sm:grid-cols-2">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 description-copy leading-relaxed text-ink-60">
                  {dict.postsEmpty}
                </p>
              )}
            </section>

            <section aria-labelledby="author-trips-heading" className="mt-14">
              <h2 id="author-trips-heading" className="heading-md text-ink">
                {dict.trips}
              </h2>

              {trips.length ? (
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 description-copy leading-relaxed text-ink-60">
                  {dict.tripsEmpty}
                </p>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  )
}
