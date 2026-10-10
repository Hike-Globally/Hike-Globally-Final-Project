import './latest-posts.css'

import { dictionary } from '@/i18n/dictionaries'
import { sitePath } from '@/i18n/config'
import type { PostCard } from '@/lib/data'
import { formatDate, readingTimeMinutes } from '@/lib/format'
import { PayloadImageFill } from '@/components/ui/payload-image'

/**
 * Latest Stories tile grid — presentational port of the "service tiles"
 * section from blog-sample.html.
 *
 * The markup mirrors the sample's `.st-*` structure exactly and
 * `latest-posts.css` carries the sample's scoped stylesheet verbatim, so the
 * hover/focus choreography is identical to the sample, not even one
 * animation different:
 *   • card lifts `translateY(-5px)` + soft shadow (0.35s cubic-bezier(.2,.75,.25,1))
 *   • cover image zooms to `scale(1.06)` (0.56s, same curve)
 *   • CTA bar wipes to the card accent colour (`::before` scaleX 0 → 1, left origin)
 *   • arrow rotates `-35deg`
 *   • identical `:focus-visible` states and `prefers-reduced-motion` opt-outs
 *
 * CMS content mapping (design untouched, words come from Payload):
 *   number → index · eyebrow → category · title → post title ·
 *   description → excerpt · tags → category + read time ·
 *   detail → author/date · CTA → "Read story" → post page.
 */

/** Accent colours cycle exactly like the sample cards do. */
const ACCENTS = ['rgb(223, 255, 143)', 'rgb(201, 194, 255)', 'rgb(255, 200, 169)']

const categoryLabel = (category: string | undefined): string | null => {
  if (!category) return null
  const dict = dictionary
  const key = `category${category
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}` as keyof typeof dict.blog
  return dict.blog[key] ?? category
}

export function StoryTiles({ posts }: { posts: PostCard[] }) {
  const dict = dictionary

  return (
    <section data-service-tiles="hg-stories" data-static="false">
      <div className="st-grid">
        {posts.map((post, index) => {
          const href = sitePath(`/blog/${post.slug}`)
          const accent = ACCENTS[index % ACCENTS.length]
          const label = categoryLabel(post.categories?.[0])
          const authorName =
            post.author && typeof post.author !== 'number' ? post.author.name : null
          const titleId = `hg-stories-title-${index}`

          return (
            <a
              key={post.id}
              className="st-card"
              data-linked="true"
              href={href}
              aria-labelledby={titleId}
              style={{ ['--st-accent' as string]: accent }}
            >
              <div className="st-media">
                <PayloadImageFill
                  media={post.featuredImage}
                  size="card"
                  sizes="(min-width: 1200px) 380px, (min-width: 810px) 30vw, 88vw"
                  priority={index === 0}
                  className="st-image"
                />
                <span className="st-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="st-body">
                <div className="st-eyebrow">
                  <span className="st-dot" aria-hidden="true"></span>
                  <span>{(label ?? dict.nav.blog).toUpperCase()}</span>
                </div>

                <h3 id={titleId} className="st-title">
                  {post.title}
                </h3>

                <p className="st-description">{post.excerpt}</p>

                <div className="st-tags">
                  {label ? <span className="st-tag">{label}</span> : null}
                  <span className="st-tag">
                    {dict.blog.readTime.replace(
                      '{minutes}',
                      String(readingTimeMinutes(post.excerpt ?? '')),
                    )}
                  </span>
                </div>

                <div className="st-footer">
                  <div className="st-detail">
                    {authorName
                      ? `${dict.blog.by} ${authorName} · ${formatDate(post.publishedAt ?? post.createdAt)}`
                      : formatDate(post.publishedAt ?? post.createdAt)}
                  </div>
                  <div className="st-cta">
                    <span className="st-cta-label">{dict.blog.readStory}</span>
                    <span className="st-arrow">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path
                          d="M5 12H19M13 6L19 12L13 18"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
