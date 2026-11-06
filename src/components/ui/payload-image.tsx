import Image from 'next/image'

import type { Media } from '@/payload-types'

import { localMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'

type PayloadImageProps = {
  media: number | Media | null | undefined
  /** Overrides the CMS alt text (only when the image is purely decorative). */
  alt?: string
  /** The layout hint is kept at call sites, but the original upload is never resized or re-encoded. */
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

/** The only frontend source for uploaded images is the original file, never a Payload crop. */
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

/** Render the uploaded image bytes, with no Payload derivative or Next image transformation. */
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
        unoptimized
        priority={priority}
        loading={loading ?? (priority ? 'eager' : 'lazy')}
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
      unoptimized
      priority={priority}
      style={{ objectPosition }}
      className={cn('object-cover', imageClassName, className)}
    />
  )
}
