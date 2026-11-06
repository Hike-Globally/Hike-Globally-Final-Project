import Image from 'next/image'

/** Homepage hero photograph, served directly from Unsplash. */
export const HOME_HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1716746023060-d6dc0b1dcbb2'

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
        className="absolute inset-0 -z-10 h-full w-full scale-[1.02] object-cover"
      />
      {/* Keep the navy wash and bottom-up scrim so the bottom-aligned hero
          copy stays legible over the photograph. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/55" />
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />
    </>
  )
}
