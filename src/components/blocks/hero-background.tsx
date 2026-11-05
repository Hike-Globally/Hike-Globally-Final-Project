/** Poster frame shown until the video loads (and on unsupported browsers). */
export const HOME_HERO_VIDEO_POSTER_URL =
  'https://images.pexels.com/videos/30923404/4k-4k-nature-video-adventure-afternoon-sunlight-30923404.jpeg'

/** Direct CDN file for Pexels video 30923404 ("Breathtaking Sunset Over Machapuchare, Nepal"). */
export const HOME_HERO_VIDEO_CDN_URL =
  'https://videos.pexels.com/video-files/30923404/13222386_3840_2160_25fps.mp4'

/** Stable Pexels download URL — fallback if the CDN link ever changes. */
export const HOME_HERO_VIDEO_DOWNLOAD_URL = 'https://www.pexels.com/download/video/30923404/'

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
        className="absolute inset-0 -z-10 h-full w-full scale-[1.02] object-cover"
      >
        <source src={HOME_HERO_VIDEO_CDN_URL} type="video/mp4" />
        <source src={HOME_HERO_VIDEO_DOWNLOAD_URL} type="video/mp4" />
      </video>
      {/* The site's navy wash over the plate, layered above the video for
          legibility, then the shared bottom-up scrim every other photographic
          header carries. The hero copy is bottom-aligned, so it always sits in
          the heaviest part of the wash — a bright frame can never wash the type
          out, whichever video the plate ends up using. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/55" />
      <div aria-hidden="true" className="photo-scrim absolute inset-0 -z-10" />
    </>
  )
}
