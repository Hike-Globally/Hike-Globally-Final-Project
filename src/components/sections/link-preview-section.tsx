import { Reveal } from '@/components/motion/reveal'
import { resolveLinkPreview, type LinkPreviewSource } from '@/lib/link-preview'

import { LinkPreviewCard } from './link-preview-card'
import './link-preview.css'

/**
 * The link card placed by the "Link preview" row in Page sections. Shared by trips and blog posts;
 * renders nothing when the page has no URL.
 */
export async function LinkPreviewSection({ source }: { source: LinkPreviewSource }) {
  const card = await resolveLinkPreview(source)
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
