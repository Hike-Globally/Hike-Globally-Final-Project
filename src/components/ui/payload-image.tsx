import Image from 'next/image'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/utils'

type ImageSize = 'thumbnail' | 'card' | 'tablet' | 'hero' | 'og'

type PayloadImageProps = {
  media: number | Media | null | undefined
  /** Overrides the CMS alt text (only when the image is purely decorative). */
  alt?: string
  /** Which of Payload's generated sizes to request. Defaults to the best fit for large art. */
  size?: ImageSize
  /**
   * REQUIRED on purpose: `sizes` is what tells the browser how wide the image will actually
   * be on screen. Without it next/image downloads a much larger file than necessary.
   */
  sizes: string
  className?: string
  imageClassName?: string
  priority?: boolean
  /** Set for images above the fold only — everything else should lazy-load. */
  loading?: 'lazy' | 'eager'
}

const sizeOrder: ImageSize[] = ['thumbnail', 'card', 'tablet', 'hero', 'og']

/**
 * Payload returns absolute media URLs as soon as `serverURL` is configured (which we want for
 * emails, OG tags and sitemaps). next/image, however, only optimises same-origin paths — an
 * absolute URL for our own host would be rejected as an unconfigured remote. Turning those
 * back into site-relative URLs keeps the optimisation pipeline working in every environment
 * (local, preview, production) with no per-host `remotePatterns` entry. URLs that point at a
 * real external CDN (Vercel Blob, S3) are left untouched.
 */
const localMediaUrl = (url: string): string => {
  if (!/^https?:\/\//.test(url)) return url
  try {
    const parsed = new URL(url)
    return parsed.pathname.startsWith('/api/media/') ? `${parsed.pathname}${parsed.search}` : url
  } catch {
    return url
  }
}

/**
 * Renders a Payload Media document with next/image.
 *
 * - picks the smallest generated size that is still large enough for the requested slot
 * - honours the editor's focal point (object-position) so crops keep the subject
 * - always carries the CMS alt text, so accessibility can never be forgotten
 * - renders nothing (instead of crashing) if the image was deleted or never populated
 */
export function PayloadImage({
  media,
  alt,
  size = 'tablet',
  sizes,
  className,
  imageClassName,
  priority = false,
  loading,
}: PayloadImageProps) {
  if (!media || typeof media === 'number') return null

  const generated = media.sizes ?? {}

  // Fall back to any available size, then to the original upload.
  const candidates: ImageSize[] = [size, ...sizeOrder.filter((entry) => entry !== size)]
  let chosen: { url?: string | null; width?: number | null; height?: number | null } | undefined

  for (const candidate of candidates) {
    const entry = generated[candidate]
    if (entry?.url) {
      chosen = entry
      break
    }
  }

  const url = chosen?.url ?? media.url
  if (!url) return null

  const width = chosen?.width ?? media.width ?? 1200
  const height = chosen?.height ?? media.height ?? 800

  // Payload stores focal point as percentages (0–100). Default to centre.
  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={localMediaUrl(url)}
        alt={alt ?? media.alt ?? ''}
        width={width}
        height={height}
        sizes={sizes}
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
  size = 'tablet',
  sizes,
  className,
  imageClassName,
  priority = false,
}: Omit<PayloadImageProps, 'className'> & { className?: string }) {
  if (!media || typeof media === 'number') return null

  const generated = media.sizes ?? {}
  const candidates: ImageSize[] = [size, ...sizeOrder.filter((entry) => entry !== size)]
  let chosen: { url?: string | null; width?: number | null; height?: number | null } | undefined

  for (const candidate of candidates) {
    const entry = generated[candidate]
    if (entry?.url) {
      chosen = entry
      break
    }
  }

  const url = chosen?.url ?? media.url
  if (!url) return null

  const objectPosition = `${media.focalX ?? 50}% ${media.focalY ?? 50}%`

  return (
    <Image
      src={localMediaUrl(url)}
      alt={alt ?? media.alt ?? ''}
      fill
      sizes={sizes}
      priority={priority}
      style={{ objectPosition }}
      className={cn('object-cover', imageClassName, className)}
    />
  )
}
