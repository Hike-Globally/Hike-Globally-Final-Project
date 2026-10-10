import Image from 'next/image'

export const HOME_HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1718880474770-1952b4e5f37c'

/** The shared, decorative background used by both homepage hero render paths. */
export function HomepageHeroBackground() {
  return (
    <>
      <Image
        src={HOME_HERO_IMAGE_URL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 scale-105 object-cover blur-sm"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/50" />
    </>
  )
}
