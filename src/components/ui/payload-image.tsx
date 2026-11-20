import Image from '@/components/ui/next-image'

import type { Media } from '@/payload-types'

import { localMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'

type PayloadImageProps = {
  media: number | Media | null | undefined
  /** Overrides the CMS alt text (only when the image is purely decorative). */
  alt?: string
  /**
   * Required layout hint — with the Next optimizer enabled this is what lets the browser pick
   * the right `srcset` candidate for the slot (e.g. `(max-width: 768px) 100vw, 33vw`) instead of
   * defaulting to the full viewport width.
   */
  sizes: string
  className?: string
  imageClassName?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
}

/**
 * Payload may return an absolute URL for media served by this site. Use a relative URL so
 * images still work behind preview domains; leave external storage URLs untouched.
 * (Kept exported from here for existing call sites — the rule itself lives in `@/lib/media-url`.)
 */
export { localMediaUrl }

/**
 * The source URL handed to `next/image`. The original upload — never a Payload crop — is used as
 * the optimizer's input: the optimizer fetches it server-side, re-encodes it to AVIF/WebP at
 * device-appropriate widths, and caches the result. The stored file itself is left byte-for-byte
 * untouched, so JSON-LD, Open Graph and the `og` share image keep working off the original.
 */
export function originalMediaUrl(media: number | Media | null | undefined): string | null {
  if (!media || typeof media === 'number' || !media.url) return null
  return localMediaUrl(media.url)
}

/** Resolve media for contexts that render their own <img> (e.g. the rope carousel). */
export function resolveMediaImage(
  media: number | Media | null | undefined,
): { src: string; alt: string } | null {
  if (!media || typeof media === 'number' || media.mimeType?.startsWith('video/')) return null
  const src = originalMediaUrl(media)
  return src ? { src, alt: media.alt ?? '' } : null
}

/**
 * Formats the optimizer cannot serve: it refuses SVG outright, and it flattens an animated GIF
 * to its first frame. Those uploads bypass optimization and render exactly as stored.
 */
const isOptimizerPassthrough = (media: Media): boolean => {
  const mime = media.mimeType?.toLowerCase()
  if (mime === 'image/svg+xml' || mime === 'image/gif') return true
  const url = media.url?.toLowerCase() ?? ''
  return url.endsWith('.svg') || url.endsWith('.gif')
}

/** Render uploaded images through the Next optimizer (responsive AVIF/WebP srcset). */
export function PayloadImage({
  media,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
  loading,
}: PayloadImageProps) {
  if (!media || typeof media === 'number') return null
  const src = originalMediaUrl(media)
  if (!src) return null

  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`

  if (media.mimeType?.startsWith('video/')) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <video
          src={src}
          poster={originalMediaUrl(media.videoThumbnail) ?? undefined}
          controls
          playsInline
          preload="metadata"
          aria-label={alt ?? media.alt ?? 'Video'}
          className={cn('h-full w-full object-contain', imageClassName)}
        />
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt ?? media.alt ?? ''}
        width={media.width ?? 1200}
        height={media.height ?? 800}
        sizes={sizes}
        unoptimized={isOptimizerPassthrough(media)}
        priority={priority}
        loading={priority ? undefined : (loading ?? 'lazy')}
        style={{ objectPosition }}
        className={cn('h-full w-full object-cover', imageClassName)}
      />
    </div>
  )
}

/** Variant that fills its (already sized) parent — use with an aspect-ratio container. */
export function PayloadImageFill({
  media,
  alt,
  sizes,
  className,
  imageClassName,
  priority = false,
}: PayloadImageProps) {
  if (!media || typeof media === 'number') return null
  const src = originalMediaUrl(media)
  if (!src) return null

  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`

  if (media.mimeType?.startsWith('video/')) {
    return (
      <video
        src={src}
        poster={originalMediaUrl(media.videoThumbnail) ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt ?? media.alt ?? 'Video'}
        style={{ objectPosition }}
        className={cn('absolute inset-0 h-full w-full object-cover', imageClassName, className)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt ?? media.alt ?? ''}
      fill
      sizes={sizes}
      unoptimized={isOptimizerPassthrough(media)}
      priority={priority}
      style={{ objectPosition }}
      className={cn('object-cover', imageClassName, className)}
    />
  )
}
