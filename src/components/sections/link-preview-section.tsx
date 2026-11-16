import { Reveal } from '@/components/motion/reveal'
import { resolveLinkPreview, type LinkPreviewSource } from '@/lib/link-preview'
import { lookupInternalLinkPreview } from '@/lib/link-preview-internal'

import { LinkPreviewCard } from './link-preview-card'

/**
 * The link card placed by the "Link preview" row in Page sections. Shared by trips and blog posts;
 * renders nothing when the page has no URL.
 *
 * The card's picture for a page on this site comes from the CMS — a trip's hero image, a post's
 * featured image — so it is the document's own featured image and needs no request of our own site
 * from inside a page render. Other sites are still read over the network.
 */
export async function LinkPreviewSection({ source }: { source: LinkPreviewSource }) {
  const card = await resolveLinkPreview(source, { internal: lookupInternalLinkPreview })
  if (!card) return null

  return (
    // No `id`: a page can now hold several Link preview rows, and one id cannot be shared.
    <section className="link-preview-section scroll-mt-24 pb-16 md:pb-24">
      <Reveal>
        <LinkPreviewCard card={card} />
      </Reveal>
    </section>
  )
}
