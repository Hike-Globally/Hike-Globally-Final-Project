/** Poster frame shown until the video loads (and on unsupported browsers). */
export const HOME_HERO_VIDEO_POSTER_URL =
  'https://images.pexels.com/videos/35701525/pexels-photo-35701525.jpeg?auto=compress&cs=tinysrgb&w=1920'

/** Direct CDN file for Pexels video 35701525 ("Golden Sunrise on Snow-Capped Himalayan Peak"). */
export const HOME_HERO_VIDEO_CDN_URL =
  'https://videos.pexels.com/video-files/35701525/15130943_1920_1080_30fps.mp4'

/** Stable Pexels download URL — fallback if the CDN link ever changes. */
export const HOME_HERO_VIDEO_DOWNLOAD_URL = 'https://www.pexels.com/download/video/35701525/'

/** The shared, decorative background used by both homepage hero render paths. */
export function HomepageHeroBackground() {
  return (
    <>
      <video
        autoPlay
        muted
        loop
        playsInline
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
        poster={HOME_HERO_VIDEO_POSTER_URL}
        className="absolute inset-0 -z-10 h-full w-full scale-[1.02] object-cover blur-[1px]"
        style={{ filter: 'blur(1px)' }}
      >
        <source src={HOME_HERO_VIDEO_CDN_URL} type="video/mp4" />
        <source src={HOME_HERO_VIDEO_DOWNLOAD_URL} type="video/mp4" />
      </video>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/50" />
    </>
  )
}
