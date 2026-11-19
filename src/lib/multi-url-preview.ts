import type { LinkPreviewSource } from './link-preview'
import { validateLinkPreviewUrl } from './link-preview'
import { parseImageProxyUrl } from './link-preview-image'

export const MULTI_URL_PREVIEW_NAME = 'Multi-URL Preview'
export const MAX_PREVIEW_LINKS = 12

export const multiPreviewLayouts = [
  { label: 'Original link cards — stacked', value: 'list' },
  { label: 'Card slider — swipe through cards', value: 'slider' },
  { label: 'Carousel — one link at a time', value: 'carousel' },
] as const

export const multiPreviewAnimations = [
  { label: 'Fade — gently appear', value: 'fade' },
  { label: 'Rise — gently lift into view', value: 'rise' },
  { label: 'Slide — glide in from the side', value: 'slide' },
  { label: 'Soft zoom — settle into place', value: 'zoom' },
  { label: 'Reveal — uncover from left to right', value: 'reveal' },
  { label: 'None — no animation', value: 'none' },
] as const

export type MultiPreviewLayout = (typeof multiPreviewLayouts)[number]['value']
export type MultiPreviewAnimation = (typeof multiPreviewAnimations)[number]['value']
export type MultiPreviewLink = LinkPreviewSource & { id?: string | null }

/** Shared by a Page sections row and a Lexical block; neither stores content elsewhere. */
export type MultiUrlPreviewSource = {
  multiPreviewHeading?: string | null
  multiPreviewDescription?: string | null
  multiPreviewLayout?: MultiPreviewLayout | null
  multiPreviewAnimation?: MultiPreviewAnimation | null
  multiPreviewLinks?: MultiPreviewLink[] | null
}

/** Root-relative site paths or public HTTP(S) URLs; never executable or credential-bearing URLs. */
export function validateMultiPreviewUrl(value: unknown): true | string {
  const valid = validateLinkPreviewUrl(value)
  if (valid !== true) return valid
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string') return 'Enter a web address.'
  const url = value.trim()
  if (!url || /[\\\u0000-\u001f\u007f]/.test(url)) return 'Enter a valid web address.'
  if (url.startsWith('/') && !url.startsWith('//')) return true
  return parseImageProxyUrl(url)
    ? true
    : 'Use a public http:// or https:// address without a password or a custom port.'
}

const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() || undefined : undefined

/** Defend the public renderer against incomplete drafts, old values and malformed JSON blocks. */
export function normalizeMultiUrlPreview(source: MultiUrlPreviewSource) {
  const rows = Array.isArray(source.multiPreviewLinks) ? source.multiPreviewLinks : []
  const links: MultiPreviewLink[] = rows
    .flatMap((row) => {
      if (!row || typeof row !== 'object') return []
      const url = text(row.linkPreviewUrl)
      if (!url || validateMultiPreviewUrl(url) !== true) return []
      return [
        {
          id: text(row.id),
          linkPreviewUrl: url,
          linkPreviewTitle: text(row.linkPreviewTitle),
          linkPreviewDescription: text(row.linkPreviewDescription),
          linkPreviewPrice: text(row.linkPreviewPrice),
          linkPreviewOriginalPrice: text(row.linkPreviewOriginalPrice),
          linkPreviewImage: row.linkPreviewImage ?? null,
          linkPreviewImageUrl: (() => {
            const imageUrl = text(row.linkPreviewImageUrl)
            return imageUrl &&
              ((imageUrl.startsWith('/') && !imageUrl.startsWith('//')) ||
                parseImageProxyUrl(imageUrl))
              ? imageUrl
              : undefined
          })(),
          linkPreviewRating:
            typeof row.linkPreviewRating === 'number' ? row.linkPreviewRating : null,
          linkPreviewReviewCount:
            typeof row.linkPreviewReviewCount === 'number' ? row.linkPreviewReviewCount : null,
        },
      ]
    })
    .slice(0, MAX_PREVIEW_LINKS)

  return {
    heading: text(source.multiPreviewHeading),
    description: text(source.multiPreviewDescription),
    layout: multiPreviewLayouts.some(({ value }) => value === source.multiPreviewLayout)
      ? source.multiPreviewLayout!
      : ('slider' as MultiPreviewLayout),
    animation: multiPreviewAnimations.some(({ value }) => value === source.multiPreviewAnimation)
      ? source.multiPreviewAnimation!
      : ('rise' as MultiPreviewAnimation),
    links,
  }
}

/** Each preset is intentionally restrained; all are disabled by the reader's motion preference. */
export const multiPreviewKeyframes: Record<Exclude<MultiPreviewAnimation, 'none'>, Keyframe[]> = {
  fade: [{ opacity: 0.2 }, { opacity: 1 }],
  rise: [
    { opacity: 0.2, transform: 'translateY(18px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ],
  slide: [
    { opacity: 0.2, transform: 'translateX(24px)' },
    { opacity: 1, transform: 'translateX(0)' },
  ],
  zoom: [
    { opacity: 0.2, transform: 'scale(0.96)' },
    { opacity: 1, transform: 'scale(1)' },
  ],
  reveal: [
    { opacity: 0.4, clipPath: 'inset(0 100% 0 0)' },
    { opacity: 1, clipPath: 'inset(0 0% 0 0)' },
  ],
}

/** Nearest snap point; used after native touch/trackpad scrolling as well as arrow navigation. */
export function nearestPreviewIndex(positions: readonly number[], offset: number): number {
  let nearest = 0
  for (let index = 1; index < positions.length; index += 1) {
    if (Math.abs(positions[index] - offset) < Math.abs(positions[nearest] - offset)) nearest = index
  }
  return nearest
}
