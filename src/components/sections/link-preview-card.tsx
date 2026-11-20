import { ArrowRight, ArrowUpRight } from 'lucide-react'

import type { ResolvedLinkPreview } from '@/lib/link-preview'

import { LinkPreviewThumb } from './link-preview-thumb'

/**
 * The link card itself: a large thumbnail, the site as an eyebrow, the title, a couple of lines of
 * description, and the price block on the right — held on the card's middle line, never
 * pushed to its foot. Purely presentational, so the shape can be rendered and asserted in tests
 * without a network fetch.
 */
export function LinkPreviewCard({ card }: { card: ResolvedLinkPreview }) {
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
      <LinkPreviewThumb
        image={card.image}
        host={card.host}
        alternatives={card.imageAlternatives}
        pageUrl={card.href}
      />

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
