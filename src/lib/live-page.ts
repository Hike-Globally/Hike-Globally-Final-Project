import { buildLivePreviewURL, resolveDocumentPath } from './live-preview-url'

/**
 * Where a "view this page on the live site" control in the admin should point.
 *
 * The admin's own URLs are irrelevant here — this is the visitor-facing route, resolved from the
 * same single source of truth the live-preview pane uses, so the two can never disagree.
 */
export type LivePageTarget = {
  /**
   * The href to open in a new tab: either the public page, or — for something that has never been
   * published — the authenticated preview entry route.
   */
  href: string
  /** The public path itself (`/trips/everest-base-camp`). Used in the link's tooltip. */
  path: string
  /**
   * True when the document has not been published, so the public URL would 404 rather than show
   * anything. Drafts are opened through `/api/live-preview`, which verifies the editor's session,
   * turns on Next's Draft Mode and then redirects to the page — so the link always lands on
   * content instead of a "not found".
   */
  isDraft: boolean
}

/** Reads a document's workflow status, tolerating rows that were fetched without it. */
const readStatus = (data: Record<string, unknown> | null | undefined): string | null => {
  const status = data?._status
  return typeof status === 'string' ? status : null
}

/**
 * Build the target for one document, or null when there is nothing to open.
 *
 * Returns null for collections without public pages (Media, Users) and for documents that have no
 * slug yet — a brand-new trip, before its slug has been derived from the title.
 */
export const resolveLivePageTarget = (
  collectionSlug: string,
  data: Record<string, unknown> | null | undefined,
): LivePageTarget | null => {
  const path = resolveDocumentPath(collectionSlug, data)
  if (!path) return null

  const status = readStatus(data)
  // An unknown status is treated as published: a published document can always be opened, and the
  // worst case for a draft that slipped through is a 404 — not a security problem either way.
  const isDraft = status !== null && status !== 'published'

  return { href: isDraft ? buildLivePreviewURL(path) : path, isDraft, path }
}

/** Tooltip for the control — explains where the click goes before it is taken. */
export const livePageTooltip = (target: LivePageTarget): string =>
  target.isDraft
    ? `Not published yet — opens a draft preview of ${target.path} in a new tab`
    : `Opens ${target.path} on the live site in a new tab`
