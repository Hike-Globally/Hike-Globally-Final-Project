# Hike Globally

Premium, multilingual website for a Himalayan trekking operator — **Next.js 16 App Router +
Payload CMS 3 + PostgreSQL**, in a single deployable application.

- Public site: `/`, `/trips`, `/destinations`, `/blog` and their detail pages, in **English,
  German and French** (localized slugs, `/de` and `/fr` prefixes).
- CMS: Payload admin at `/admin`, drafts + versions + role-based access control.
- Content saved in the CMS appears on the site immediately (tag-based on-demand revalidation).

Full architecture, data model, caching strategy and trade-offs: **[docs/IMPLEMENTATION-PLAN.md](docs/IMPLEMENTATION-PLAN.md)**.

## Quick start

```bash
npm install
cp .env.example .env.local     # set DATABASE_URI and PAYLOAD_SECRET
npm run migrate                # create/apply the schema
npm run seed                   # demo content: 12 images, 4 destinations, 6 trips, 5 posts, 2 pages
npm run dev                    # site on :3000 · admin on /admin
```

Seeded admin login: `admin@hikeglobally.com` / `hike-globally-2026` — change it before deploying.

## Environment

| Variable                              | Purpose                                                                                                                                                                 |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URI`                        | PostgreSQL connection string (required)                                                                                                                                 |
| `PAYLOAD_SECRET`                      | Payload encryption key (required)                                                                                                                                       |
| `NEXT_PUBLIC_SITE_URL`                | Canonical origin — used for OG tags, sitemap, emails. Include the scheme (`https://hikeglobally.com`); a bare host is auto-repaired to `https://`, but don't rely on it |
| `REVALIDATE_SECRET`                   | Bearer token for `POST /api/revalidate`                                                                                                                                 |
| `NEXT_PUBLIC_FORMSUBMIT_EMAIL`        | Fallback recipient for the inquiry form                                                                                                                                 |
| `NEXT_PUBLIC_FORMSUBMIT_SUCCESS_PATH` | Where visitors land after submitting (default `/inquiry/thank-you`)                                                                                                     |
| `MEDIA_STORAGE`                       | Optional. Force a media storage mode: `blob`, `database` or `local`. Unset, the mode is picked automatically (see below)                                                |
| `BLOB_CLIENT_UPLOADS`                 | Set to `true` to upload straight from the browser to Vercel Blob, bypassing the ~4.5 MB request-body limit. Needs the Blob store's CORS settings                        |

### Media storage

Uploads are written to disk only when that actually works. The mode is resolved at startup (and
logged as `[media] storage mode: …`):

| Mode       | Where the bytes go              | When it is chosen                                                                                             |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `blob`     | Vercel Blob                     | `BLOB_READ_WRITE_TOKEN` is set (connect a Blob store in Vercel)                                               |
| `database` | `media_files` table in Postgres | Serverless host with no Blob store — uploads keep working on a read-only filesystem, capped at 25 MB per file |
| `local`    | `./public/media`                | Local development and normal servers                                                                          |

Both cloud modes serve files from the same `/api/media/file/<filename>` URLs, so the frontend,
`next/image` and the admin are unaffected by the choice. `src/lib/media-storage.ts` documents the
rules; `src/storage/` holds the Postgres adapter. On Vercel, note that a function request body is
capped at ~4.5 MB — larger originals need Blob plus `BLOB_CLIENT_UPLOADS=true`.

## Scripts

| Script                                                           | Description                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| `dev` / `build` / `start`                                        | Next.js                                                            |
| `typecheck`                                                      | `tsc --noEmit`                                                     |
| `test`                                                           | Node's built-in runner — unit tests for the site-URL normalization |
| `lint`                                                           | ESLint                                                             |
| `migrate` / `migrate:create` / `migrate:status` / `migrate:down` | Payload migrations                                                 |
| `generate:types`                                                 | Regenerate `src/payload-types.ts` after a schema change            |
| `generate:importmap`                                             | Regenerate the admin import map (also runs on `postinstall`)       |
| `seed`                                                           | Load the demo content                                              |

## Design tokens

Headings **Google Sans Flex 600**, body **Archivo 300** (self-hosted variable fonts).

| Token   | Hex       |
| ------- | --------- |
| `ink`   | `#01161e` |
| `deep`  | `#124559` |
| `slate` | `#598392` |
| `sage`  | `#aec3b0` |
| `mist`  | `#f8f9fa` |

## Deployment

Vercel + hosted Postgres + Vercel Blob for media (without a Blob store the deployment falls back to
Postgres storage — see [Media storage](#media-storage)). See
[§9 of the implementation plan](docs/IMPLEMENTATION-PLAN.md#9-deployment); the short version is
`npm ci && npm run migrate && npm run build`, with the four environment variables above set.
