/**
 * Upload URL normalisation — one rule, in one place, for every place that renders or links to a
 * Payload upload (images in `PayloadImage`, the trip brochure download).
 *
 * Payload may return an absolute URL (`https://hikeglobally.com/api/media/file/x.pdf`) for media
 * served by this site. Turning that into a relative path keeps links working on preview domains,
 * tunnels and sandboxes; URLs that belong to external storage (Vercel Blob, S3, R2) are left alone
 * because they are served from another host entirely.
 *
 * Pure and dependency-free so it can be unit-tested directly.
 */
export const localMediaUrl = (url: string): string => {
  if (!/^https?:\/\//.test(url)) return url
  try {
    const parsed = new URL(url)
    return parsed.pathname.startsWith('/api/media/') ? `${parsed.pathname}${parsed.search}` : url
  } catch {
    return url
  }
}
