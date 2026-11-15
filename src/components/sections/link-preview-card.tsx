import { ArrowRight, ArrowUpRight, Star } from 'lucide-react'

import type { ResolvedLinkPreview } from '@/lib/link-preview'

import { LinkPreviewThumb } from './link-preview-thumb'

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
 * The link card itself: a large thumbnail, the site as an eyebrow, the title, a couple of lines of
 * description, the rating, and the price block on the right — held on the card's middle line, never
 * pushed to its foot. Purely presentational, so the shape can be rendered and asserted in tests
 * without a network fetch.
 */
export function LinkPreviewCard({ card }: { card: ResolvedLinkPreview }) {
  const hasRating = card.rating !== null
  const hasReviews = card.reviewCount !== null
  const hasPrice = Boolean(card.price || card.originalPrice)
  // When the page gave us nothing to work with, the title *is* the host; don't print it twice.
  const showHost = card.title.trim().toLowerCase() !== card.host.toLowerCase()

  return (
    <a
      className="link-preview-card"
      href={card.href}
      target={card.external ? '_blank' : undefined}
      rel={card.external ? 'noopener noreferrer' : undefined}
    >
      <LinkPreviewThumb image={card.image} host={card.host} />

      <span className="link-preview-body">
        {showHost ? (
          <span className="link-preview-host">
            <span className="link-preview-host-name">{card.host}</span>
            {card.external ? (
              <ArrowUpRight className="link-preview-host-icon" aria-hidden="true" />
            ) : null}
          </span>
        ) : null}

        <span className="link-preview-title">{card.title}</span>
        {card.description ? (
          <span className="link-preview-description">{card.description}</span>
        ) : null}

        {hasRating || hasReviews ? (
          <span className="link-preview-meta">
            {hasRating ? (
              <span className="link-preview-rating">
                <span className="link-preview-score">{card.rating?.toFixed(1)}</span>
                <RatingStars rating={card.rating ?? 0} />
              </span>
            ) : null}
            {hasReviews ? (
              <span className="link-preview-count">
                {card.reviewCount?.toLocaleString('en-US')}{' '}
                {card.reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            ) : null}
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

      <span className="link-preview-go" aria-hidden="true">
        {card.external ? <ArrowUpRight /> : <ArrowRight />}
      </span>
    </a>
  )
}
