import type { Payload } from 'payload'

import { defaultLocale } from '@/i18n/config'
import { absoluteUrl, canonicalUrl } from './seo'

export const RSS_FEED_PATH = '/feed.xml'
export const RSS_POST_LIMIT = 50

export type RssPost = {
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  _status?: 'draft' | 'published' | null
  meta?: { noIndex?: boolean | null } | null
}

/** Summary-only feed: no rich-text bodies, uploads, private author emails, or demo fallback data. */
export async function readRssPosts(payload: Pick<Payload, 'find'>): Promise<RssPost[]> {
  // Query dated and legacy undated posts separately. PostgreSQL sorts NULL dates first for DESC;
  // one limited query could otherwise crowd recent posts out with old, undated records.
  const results = await Promise.all([true, false].map((hasPublicationDate) => payload.find({
    collection: 'blog',
    locale: defaultLocale,
    depth: 0,
    limit: RSS_POST_LIMIT,
    sort: hasPublicationDate ? ['-publishedAt', '-createdAt', 'id'] : ['-createdAt', 'id'],
    overrideAccess: false,
    where: {
      and: [
        { _status: { equals: 'published' } },
        { 'meta.noIndex': { not_equals: true } },
        { publishedAt: { exists: hasPublicationDate } },
      ],
    },
    select: {
      title: true, slug: true, excerpt: true, publishedAt: true,
      createdAt: true, updatedAt: true, _status: true, meta: { noIndex: true },
    },
  })))
  return results.flatMap((result) => result.docs)
}

/** XML 1.0 text, including protection against invalid control characters and lone surrogates. */
const xml = (value: string): string => value
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ud800-\udfff\ufffe\uffff]/gu, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const timestamp = (value?: string | null): number | undefined => {
  const parsed = value ? Date.parse(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

/** Canonical URLs are also GUIDs: an edit does not create a second item in a subscriber's reader. */
export function buildRssFeed(
  posts: RssPost[] = [],
  { siteName, tagline }: { siteName: string; tagline?: string | null },
): string {
  const seen = new Set<string>()
  const entries = posts
    .filter((post) => post._status !== 'draft' && !post.meta?.noIndex && post.slug?.trim() && post.title?.trim())
    .map((post) => ({
      post,
      url: canonicalUrl(`/blog/${post.slug}`),
      published: timestamp(post.publishedAt) ?? timestamp(post.createdAt),
    }))
    .sort((a, b) => (b.published ?? -Infinity) - (a.published ?? -Infinity))
    .filter(({ url }) => {
      if (seen.has(url)) return false
      seen.add(url)
      return true
    })
    .slice(0, RSS_POST_LIMIT)

  const updates = entries.flatMap(({ post, published }) => {
    const updated = timestamp(post.updatedAt)
    return [updated, published].filter((date): date is number => date !== undefined)
  })
  const lastBuildDate = updates.length ? new Date(Math.max(...updates)).toUTCString() : undefined
  const title = `${siteName} — Blog`

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '<channel>',
    `<title>${xml(title)}</title>`,
    `<link>${xml(canonicalUrl('/blog'))}</link>`,
    `<description>${xml(tagline?.trim() || `Latest travel guides and stories from ${siteName}.`)}</description>`,
    `<language>${defaultLocale}</language>`,
    `<atom:link href="${xml(absoluteUrl(RSS_FEED_PATH))}" rel="self" type="application/rss+xml" />`,
    ...(lastBuildDate ? [`<lastBuildDate>${lastBuildDate}</lastBuildDate>`] : []),
    ...entries.map(({ post, url, published }) => [
      '<item>',
      `<title>${xml(post.title!.trim())}</title>`,
      `<link>${xml(url)}</link>`,
      `<guid isPermaLink="true">${xml(url)}</guid>`,
      // RSS descriptions allow HTML. Encode the plain-text excerpt as HTML, then as XML text,
      // so even a literal <tag> is displayed as text rather than interpreted by a feed reader.
      ...(post.excerpt?.trim() ? [`<description>${xml(xml(post.excerpt.trim()))}</description>`] : []),
      ...(published !== undefined ? [`<pubDate>${new Date(published).toUTCString()}</pubDate>`] : []),
      '</item>',
    ].join('\n')),
    '</channel>',
    '</rss>',
    '',
  ].join('\n')
}
