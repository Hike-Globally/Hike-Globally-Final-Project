/**
 * Pure decision helpers for `src/hooks/revalidate.ts`.
 *
 * Kept dependency-free (no `next/cache` or `payload` runtime imports) so `npm test` can exercise
 * every draft, autosave, publish, unpublish and delete transition directly in Node.
 */

export const slugOf = (doc: unknown): string | undefined => {
  if (!doc || typeof doc !== 'object') return undefined
  const slug = (doc as { slug?: unknown }).slug
  return typeof slug === 'string' && slug.length > 0 ? slug : undefined
}

export const statusOf = (doc: unknown): string | undefined => {
  if (!doc || typeof doc !== 'object') return undefined
  const status = (doc as { _status?: unknown })._status
  return typeof status === 'string' ? status : undefined
}

const isTruthyParam = (value: unknown): boolean => value === true || value === 'true'

/**
 * Whether a collection `afterChange` write changed anything the public storefront renders.
 *
 * Public routes only ever query `_status: 'published'` rows from the main collection table.
 * Payload's editor autosave (`?autosave=true&draft=true`) and "Save draft" (`?draft=true`) write
 * exclusively to the `_*_v` versions table and leave the published row untouched — purging Next's
 * Data Cache and Full Route Cache on those writes used to wipe the public cache on every typing
 * pause and force cold renders across the site.
 *
 * Revalidate only when public content can actually change:
 *   • a document is published (`doc._status === 'published'`),
 *   • a previously published document is unpublished (`previousDoc._status === 'published'`
 *     changing to `'draft'` without `draft=true` / `autosave=true`), or
 *   • the collection does not use draft statuses (`doc._status === undefined`).
 */
export const shouldRevalidateAfterChange = ({
  doc,
  previousDoc,
  req,
}: {
  doc: unknown
  previousDoc?: unknown
  req?: { query?: Record<string, unknown> }
}): boolean => {
  const nextStatus = statusOf(doc)
  if (nextStatus === 'published') return true

  if (isTruthyParam(req?.query?.autosave) || isTruthyParam(req?.query?.draft)) {
    return false
  }

  if (nextStatus === undefined) return true

  return statusOf(previousDoc) === 'published'
}

/**
 * Deleting a row that was never published (`_status: 'draft'` in the main table) cannot affect any
 * public route or `/sitemap.xml`.
 */
export const shouldRevalidateAfterDelete = ({ doc }: { doc: unknown }): boolean =>
  statusOf(doc) !== 'draft'
