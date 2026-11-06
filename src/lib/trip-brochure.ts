import type { Media, Trip } from '@/payload-types'

import { sitePath } from '@/i18n/config'

/**
 * The trip brochure — the downloadable PDF (or image) version of an itinerary.
 *
 * Kept out of the view for two reasons: the rules are worth testing on their own, and the sidebar
 * control stays a single readable component. A brochure exists only when the editor uploaded a
 * file **and** that file has a resolvable URL — Payload returns a bare id when the relationship is
 * not populated, and an empty `url` when the storage object behind it is gone.
 */

/** Everything the download button needs, resolved from one trip. */
export type TripBrochure = {
  /**
   * The site's own download route — `/trips/<slug>/brochure` — never the storage URL.
   *
   * It answers with `Content-Disposition: attachment` and the friendly file name, which is the
   * only way a download works when the bytes live on another origin (Vercel Blob, S3): browsers
   * ignore an anchor's `download` attribute for cross-origin files, so a direct link would open
   * the PDF in a viewer instead of saving it. See that route for the rest of the reasoning.
   */
  url: string
  /** Server file name, used as the anchor's `download` attribute. */
  filename: string
  /** `application/pdf` for a document; `image/*` for an image brochure. */
  mimeType: string
  /** Human label for the file kind — "PDF" or "Image". */
  kindLabel: string
  /** The button's own text, defaulting to the dictionary's CTA. */
  label: string
  /** One line under the button: "PDF · 2.3 MB", or the editor's own description. */
  note?: string
}

/** 2_412_953 → "2.3 MB". */
export const formatFileSize = (bytes: number | null | undefined): string => {
  if (!bytes || bytes <= 0) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/**
 * A downloaded brochure keeps a name a human recognises: `everest-base-camp-trek-brochure.pdf`.
 *
 * Shared with the `/trips/<slug>/brochure` route, which sets the same name in
 * `Content-Disposition` — the anchor's `download` attribute alone is ignored for a cross-origin
 * file (Vercel Blob, S3), so both halves have to agree.
 */
export const brochureDownloadName = (
  tripSlug: string | null | undefined,
  media: Pick<Media, 'filename'> | null | undefined,
): string => {
  const original = media?.filename?.trim()
  const extension = original?.includes('.') ? original.slice(original.lastIndexOf('.')) : ''
  const base = (tripSlug || 'trip').trim() || 'trip'
  return `${base}-brochure${extension}`
}

/**
 * Resolves the trip's brochure, or `null` when there is nothing to download.
 *
 * `defaultLabel` is the translated CTA; the editor's own title wins when it is set, so a brochure
 * covering a whole season can say so ("Download 2027 dates").
 */
export const resolveTripBrochure = (
  trip: Pick<Trip, 'brochureFile' | 'brochureTitle' | 'brochureNote'>,
  tripSlug: string | null | undefined,
  defaultLabel: string,
): TripBrochure | null => {
  const file = trip.brochureFile
  if (!file || typeof file === 'number' || !file.url) return null

  const mimeType = file.mimeType ?? ''
  const kindLabel = mimeType === 'application/pdf' ? 'PDF' : 'Image'
  const customNote = trip.brochureNote?.trim()
  // "PDF · 2.3 MB" — the two things someone weighs before tapping download. An editor's note
  // replaces it outright, because they know their file better than a MIME type does.
  const details = [kindLabel, formatFileSize(file.filesize)].filter(Boolean).join(' · ')

  return {
    url: sitePath(`/trips/${tripSlug}/brochure`),
    filename: brochureDownloadName(tripSlug, file),
    mimeType,
    kindLabel,
    label: trip.brochureTitle?.trim() || defaultLabel,
    note: customNote || details,
  }
}
