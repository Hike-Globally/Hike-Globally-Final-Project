# Trip Brochure

An optional PDF (or single-page image) of a trip itinerary that visitors can download from the
trip page.

## For editors

The **Trip Brochure** panel sits directly under **Pricing** on every trip, and it is part of the
document — not of Page sections, so it cannot be reordered away.

| Field               | What it does                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brochure file**   | The file itself. PDF preferred; a JPG, PNG or WebP page also works. Files are stored in the Media library, so the same limits apply as for photographs. Leave it empty and no button appears. |
| **Button title**    | Optional. Defaults to “Download Trip Brochure”. Useful when the file covers a whole season (“Download 2027 dates”).                                                                           |
| **Supporting note** | Optional single line under the button. Defaults to the file's type and size, e.g. “PDF · 2.3 MB”.                                                                                             |

The button appears under **Book This Trek** in the trip sidebar, and in the same card where that
card stacks under the intro copy on mobile. Clearing the file removes the button everywhere.
Only published trips serve their brochure — a draft's file is not downloadable.

## How the download works

The button does not link at the storage URL. It links at `/trips/<slug>/brochure`, a route in
`src/app/(frontend)/trips/[slug]/brochure/route.ts` that:

1. looks the **published** trip up by slug and takes its brochure relationship — the trip document
   is the source of truth for what may be downloaded;
2. resolves the stored media URL (root-relative on local disk, absolute on Vercel Blob / S3) and
   fetches it, following at most three redirects and refusing any non-http(s) target;
3. streams the bytes back with `Content-Disposition: attachment` and a readable filename
   (`everest-base-camp-trek-brochure.pdf`).

Why the detour: browsers ignore an anchor's `download` attribute for a **cross-origin** file, so
linking straight at a Vercel Blob URL would open the PDF in a viewer instead of downloading it —
the button would promise one thing and do another. Serving from the site's own origin makes the
download real, on every storage mode, and keeps the storage location an implementation detail.

## Code map

| File                                                     | Role                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/collections/Trips.ts`                               | The `brochureFile` / `brochureTitle` / `brochureNote` fields (the “Trip Brochure” panel).        |
| `src/collections/Media.ts`                               | Allows `application/pdf` in the media library.                                                   |
| `src/lib/trip-brochure.ts`                               | Resolves a trip into something renderable, or `null`. Tested in `trip-brochure.test.ts`.         |
| `src/components/trips/trip-brochure-button.tsx`          | The control itself: a hairline outline under the filled booking CTA.                             |
| `src/components/views/trip-detail.tsx`                   | Renders it inside the booking card (sidebar + mobile stack).                                     |
| `src/app/(frontend)/trips/[slug]/brochure/route.ts`      | The same-origin download endpoint.                                                               |
| `src/lib/trip-brochure-fetch.ts`                         | URL resolution, bounded redirects, scheme checks. Tested in `trip-brochure-fetch.test.ts`.       |
| `src/migrations/20261106_120000_trip_brochure.{ts,json}` | Six nullable columns (the upload and its two localized overrides, on the trips and drafts tables), their indexes and `set null` foreign keys. |
| `src/lib/trip-brochure-schema.ts`                        | Those six columns as one list, shared by the boot-time repair and the drift tests.               |
| `src/lib/schema-repair.ts`                               | Completes the columns on a database the failed build left half-migrated.                         |
| `src/lib/migration-guard.ts`                             | Advisory-locks every production migration so concurrent boots cannot collide.                     |

## Design notes

- The booking CTA stays the only filled control in the card. A second filled button would split
  the page's single most important decision in two.
- The download is a hairline outline in `mist` at 30% — same height (52px) and type size as the
  CTA, half the volume; the arrow slides down on hover.
- The file's kind and size live in one muted line underneath (`text-mist/65`, 6.2:1 on the ink
  card), so the control itself stays a single readable phrase and the card never grows into a
  paragraph.

## Deployment

Run `npm run migrate`. `20261106_120000_trip_brochure` adds six nullable columns — the upload and
its two localized overrides, each mirrored on the drafts tables — with their indexes and foreign
keys. It touches no existing content, and every existing trip simply renders no button until a file
is uploaded.

On Vercel the migration is applied by Payload at boot, which means it can run in several build
workers at once; `src/lib/migration-guard.ts` serialises them. The version of this migration that
shipped first created only the two `_id` columns, so a database that ran it can be missing
`brochure_title` / `brochure_note` while `payload_migrations` already lists it as done. Both the
migration and the boot-time `src/lib/schema-repair.ts` close that gap idempotently — see
[Deployment in the README](../README.md#deployment) for the full story.

## Verification

- `npm test` — the resolver's rules (missing/unpopulated upload, editor overrides, file names,
  sizes) and the route's fetcher (URL resolution, redirect cap, scheme refusal).
- `npm run typecheck`, `npm run lint`, `npm run build`.
- Concurrency: three simultaneous production boots against one empty database all succeed, and the
  brochure migration is applied exactly once (verified with `npx payload migrate` and with
  `getPayload()` under `NODE_ENV=production`).
- End-to-end: upload a PDF through the admin, attach it to a published trip, then open
  `/trips/<slug>` — the button should read “Download Trip Brochure”, and the downloaded file
  should arrive named `<slug>-brochure.pdf`. Unpublishing the trip makes the route 404.
