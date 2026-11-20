import type { MetadataRoute } from 'next'

import type { Media } from '@/payload-types'
import { absoluteUrl } from './seo'
import { httpUrl } from './http-url'
import { localMediaUrl } from './media-url'

export type SitemapVideo = NonNullable<MetadataRoute.Sitemap[number]['videos']>[number]
export type SitemapMedia = { images?: string[]; videos?: SitemapVideo[] }
type Upload = number | Media | null | undefined

/** Original public upload URLs, never optimizer URLs, thumbnails, or guessed relationship IDs. */
export function sitemapAssetUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined
  let url = value.trim()
  if (/^https?:\/\//i.test(url)) {
    const valid = httpUrl(url)
    if (!valid) return undefined
    url = localMediaUrl(valid)
  } else if (!url.startsWith('/') || url.startsWith('//')) {
    return undefined
  }
  return httpUrl(absoluteUrl(url))
}

export function sitemapImageUrl(upload: Upload): string | undefined {
  if (!upload || typeof upload !== 'object') return undefined
  const url = sitemapAssetUrl(upload.url)
  if (!url) return undefined
  if (upload.mimeType ? !upload.mimeType.startsWith('image/') : !/\.(avif|webp|jpe?g|png|gif|svg)(?:[?#]|$)/i.test(url)) {
    return undefined
  }
  return url
}

/** Videos are opt-in: real alt/title + caption/description + a representative uploaded still. */
export function sitemapMedia(uploads: Upload[]): SitemapMedia {
  const images = new Set<string>()
  const videos = new Map<string, SitemapVideo>()
  for (const upload of uploads) {
    if (!upload || typeof upload !== 'object') continue
    if (upload.mimeType?.startsWith('video/')) {
      const content = sitemapAssetUrl(upload.url)
      const thumbnail = sitemapImageUrl(upload.videoThumbnail)
      const title = upload.alt?.trim()
      const description = upload.caption?.trim()
      if (content && thumbnail && title && description) {
        videos.set(content, {
          title: title.slice(0, 100),
          description: description.slice(0, 2048),
          thumbnail_loc: thumbnail,
          content_loc: content,
        })
      }
    } else {
      const image = sitemapImageUrl(upload)
      if (image) images.add(image)
    }
  }
  return {
    ...(images.size ? { images: [...images].slice(0, 1000) } : {}),
    ...(videos.size ? { videos: [...videos.values()] } : {}),
  }
}

/** Next's sitemap serializer interpolates media fields verbatim; escape exactly once at output. */
export function sitemapMediaXml(media: SitemapMedia): SitemapMedia {
  const xml = (text: string) => text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  return {
    ...(media.images?.length ? { images: [...new Set(media.images)].slice(0, 1000).map(xml) } : {}),
    ...(media.videos?.length ? {
      videos: media.videos.map((video) => ({
        ...video,
        title: xml(video.title),
        description: xml(video.description),
        thumbnail_loc: xml(video.thumbnail_loc),
        ...(video.content_loc ? { content_loc: xml(video.content_loc) } : {}),
      })),
    } : {}),
  }
}
