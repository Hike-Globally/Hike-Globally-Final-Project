import Image from 'next/image'
import { HOME_HERO_IMAGE_URL } from '@/lib/site-assets'

/**
 * Homepage hero photograph — bundled with the site at `public/images/home/hero-bg.webp`
 * (the source art is the 1920 × 1280 `Hero-Image-BG.webp` in the repo root).
 *
 * It ships from our own origin rather than a third-party CDN: the hero is the LCP element, so
 * there is no extra DNS/TLS handshake in the critical path, no remote-host allowlist to keep in
 * `next.config.mjs`, and the picture cannot change or disappear under us.
 */
export { HOME_HERO_IMAGE_URL } from '@/lib/site-assets'

/** The shared, decorative background used by both homepage hero render paths. */
export function HomepageHeroBackground() {
  return (
    <>
      <Image
        src={HOME_HERO_IMAGE_URL}
        alt=""
        fill
        sizes="100vw"
        preload
        fetchPriority="high"
        aria-hidden="true"
        /* The summit sits slightly left of centre in the 3:2 original. On a
           portrait phone the hero is a tall, narrow window, so a plain centre
           crop slices the peak in half — bias the window left there, and centre
           it again from `sm` up, where the band is wide enough to hold the
           whole ridge. */
        className="absolute inset-0 -z-10 h-full w-full scale-[1.02] object-cover object-[32%_50%] sm:object-center"
      />
      {/* Keep the navy wash and bottom-up scrim so the bottom-aligned hero
          copy stays legible over the photograph. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/55" />
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />
    </>
  )
}
