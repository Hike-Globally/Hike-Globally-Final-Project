import { getPayloadClient } from '@/lib/payload'
import { resolveSiteUrl } from '@/lib/site-url'
import { brochureDownloadName } from '@/lib/trip-brochure'
import { fetchStoredFile, resolveStoredUrl } from '@/lib/trip-brochure-fetch'

/**
 * `GET /trips/<slug>/brochure` — hands the visitor the trip's brochure as a same-origin download.
 *
 * Why not link straight at the media URL? Because on a Vercel Blob (or S3 / R2) deployment that
 * URL lives on *another host*, and browsers ignore an anchor's `download` attribute for
 * cross-origin files: the PDF then opens in a viewer instead of saving, and the button's promise
 * quietly fails. Serving the bytes from the site's own origin makes `Content-Disposition`
 * authoritative and gives the file a human name (`everest-base-camp-trek-brochure.pdf`).
 *
 * The trip document decides *which* file may be downloaded, so clearing the brochure in the CMS
 * stops the download as soon as the page revalidates. Only published trips are served — the
 * brochure of an unpublished draft is not public.
 */

type BrochureFile = {
  url?: string | null
  filename?: string | null
  mimeType?: string | null
}

const notFound = (): Response =>
  new Response('This trip has no brochure to download.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params

  let file: BrochureFile | null = null
  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'trips',
      where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
      limit: 1,
      // Depth 1 populates the upload from its relationship id; nothing else is needed.
      depth: 1,
      select: { brochureFile: true },
    })
    const brochure = docs[0]?.brochureFile
    file = brochure && typeof brochure === 'object' ? (brochure as BrochureFile) : null
  } catch {
    // No database, or an unreachable one: there is nothing to download.
    return notFound()
  }

  const upstream = file?.url ? resolveStoredUrl(file.url, resolveSiteUrl()) : null
  if (!file || !upstream) return notFound()

  const response = await fetchStoredFile(upstream)
  if (!response?.body) return notFound()

  const headers = new Headers({
    'Content-Type':
      file.mimeType || response.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${brochureDownloadName(slug, file)}"`,
    // The URL is stable while the bytes are not, so let the CDN hold it briefly and have the
    // browser revalidate rather than keeping a replaced brochure for a year.
    'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
  })

  const length = response.headers.get('content-length')
  if (length) headers.set('Content-Length', length)

  return new Response(response.body, { status: 200, headers })
}
