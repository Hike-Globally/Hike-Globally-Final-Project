import { Star } from 'lucide-react'

import { Reveal } from '@/components/motion/reveal'
import { resolveLinkPreview, type LinkPreviewSource } from '@/lib/link-preview'

import './link-preview.css'

const STARS = [0, 1, 2, 3, 4]

/** Five stars filled to the rating, including halves (4.6 fills 92% of the last star's span). */
function RatingStars({ rating }: { rating: number }) {
  const fill = `${(rating / 5) * 100}%`
  return (
    <span className="link-preview-stars" aria-hidden="true">
      <span className="link-preview-stars-row link-preview-stars-row--empty">
        {STARS.map((index) => (
          <Star key={index} className="size-[15px]" strokeWidth={0} fill="currentColor" />
        ))}
      </span>
      <span
        className="link-preview-stars-row link-preview-stars-row--filled"
        style={{ width: fill }}
      >
        {STARS.map((index) => (
          <Star key={index} className="size-[15px]" strokeWidth={0} fill="currentColor" />
        ))}
      </span>
    </span>
  )
}

/**
 * The link card placed by the "Link preview" row in Page sections: thumbnail, title, one line of
 * description, rating with review count, and prices on the right. Shared by trips and blog posts.
 * Renders nothing when the page has no URL.
 */
export async function LinkPreviewSection({ source }: { source: LinkPreviewSource }) {
  const card = await resolveLinkPreview(source)
  if (!card) return null

  const hasRating = card.rating !== null
  const hasReviews = card.reviewCount !== null
  const hasPrice = Boolean(card.price || card.originalPrice)

  return (
    <section id="link-preview" className="link-preview-section scroll-mt-24 pb-16 md:pb-24">
      <Reveal>
        <a
          className="link-preview-card"
          href={card.href}
          target={card.external ? '_blank' : undefined}
          rel={card.external ? 'noopener noreferrer' : undefined}
        >
          <span className="link-preview-thumb" aria-hidden="true">
            {card.image ? (
              // Remote images come from whichever page was linked, so they bypass the optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.image} alt="" loading="lazy" decoding="async" />
            ) : null}
          </span>

          <span className="link-preview-body">
            <span className="link-preview-title">{card.title}</span>
            {card.description ? (
              <span className="link-preview-description">{card.description}</span>
            ) : null}

            {hasRating || hasReviews ? (
              <span className="link-preview-meta">
                <span className="link-preview-rating">
                  {hasRating ? (
                    <>
                      <span className="link-preview-score">{card.rating?.toFixed(1)}</span>
                      <RatingStars rating={card.rating ?? 0} />
                    </>
                  ) : null}
                  {hasReviews ? (
                    <span className="link-preview-count">
                      {card.reviewCount?.toLocaleString('en-US')}{' '}
                      {card.reviewCount === 1 ? 'review' : 'reviews'}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : null}
          </span>

          {hasPrice ? (
            <span className="link-preview-price">
              {card.originalPrice ? (
                <span className="link-preview-price-was">{card.originalPrice}</span>
              ) : null}
              {card.price ? <span className="link-preview-price-now">{card.price}</span> : null}
            </span>
          ) : null}
        </a>
      </Reveal>
    </section>
  )
}
