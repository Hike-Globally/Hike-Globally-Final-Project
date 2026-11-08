import { getLlmsTxtSources, getSettings } from '@/lib/data'
import { buildLlmsTxt } from '@/lib/llms-txt'

/**
 * `GET /llms.txt` — the site described to a language model, in the shape the proposal at
 * https://llmstxt.org asks for: an H1, a blockquote summary, a few paragraphs of detail, and H2
 * sections of links.
 *
 * It is a route rather than a file in `public/` because two thirds of it is a list of published
 * trips, destinations, posts and pages. A checked-in text file would be wrong the moment an editor
 * publishes a trip; this one is built from the same cached Payload reads as the site and rebuilt
 * whenever content changes (`src/hooks/revalidate.ts` purges it next to `/sitemap.xml`).
 *
 * The rules — what is listed, how each line is spelled, what is skipped — live in
 * `src/lib/llms-txt.ts`, so they can be tested without a database. This file only wires them to a
 * request.
 */

/** Prerendered and revalidated like `/sitemap.xml`; publishing purges it immediately. */
export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const [sources, settings] = await Promise.all([getLlmsTxtSources(), getSettings()])

  const body = buildLlmsTxt(sources, {
    siteName: settings.siteName,
    tagline: settings.tagline,
    email: settings.email,
  })

  return new Response(body, {
    status: 200,
    headers: {
      // Plain text, not `text/markdown`: the file is read by tools that fetch the URL and expect
      // the bytes a browser would show, and a charset makes the prose unambiguous.
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
