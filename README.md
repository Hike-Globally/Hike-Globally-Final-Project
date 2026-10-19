# Hike Globally

Website for a Himalayan trekking operator — **Next.js 16 App Router +
Payload CMS 3 + PostgreSQL**, in a single deployable application.

- Public site in **English**, at plain URLs: `/`, `/trips`, `/destinations`, `/blog` and their
  detail pages. No locale prefixes. (The site used to serve `/en`, `/de` and `/fr`; those URLs
  now 308-redirect to the same page without the prefix.)
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

| Script                                                           | Description                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `dev` / `build` / `start`                                        | Next.js                                                                                                                     |
| `typecheck`                                                      | `tsc --noEmit`                                                                                                              |
| `test`                                                           | Node's built-in runner — URL/canonical helpers, media storage, and a route audit that every page declares its own canonical |
| `lint`                                                           | ESLint                                                                                                                      |
| `migrate` / `migrate:create` / `migrate:status` / `migrate:down` | Payload migrations                                                                                                          |
| `generate:types`                                                 | Regenerate `src/payload-types.ts` after a schema change                                                                     |
| `generate:importmap`                                             | Regenerate the admin import map (also runs on `postinstall`)                                                                |
| `seed`                                                           | Load the demo content                                                                                                       |

## Design tokens

Headings **Google Sans Flex 600**, body **Archivo 300** (self-hosted variable fonts).

| Token   | Hex       |
| ------- | --------- |
| `ink`   | `#01161e` |
| `deep`  | `#124559` |
| `slate` | `#598392` |
| `sage`  | `#aec3b0` |
| `mist`  | `#f8f9fa` |

## SEO

**One page, one URL.** Every page renders `<link rel="canonical">` pointing at its own exact URL —
`https://hikeglobally.com/trips/everest-base-camp`, never the homepage and never a filtered or
slash-variant spelling of itself. Two layers guarantee that, including for pages that do not exist
yet:

| Layer              | Where                                                         | What it does                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Per page           | `generateMetadata` → `buildMetadata({ path })`                | The canonical is built from the route's own path (`sitePath(`/trips/${slug}`)`), so it stays exact for content published after the last deploy. Also feeds `og:url` and the JSON-LD `url`. |
| Site-wide fallback | `(frontend)/layout.tsx` → `canonical: resolveSiteUrlObject()` | Next resolves a `URL` _instance_ against the request pathname, so a route that exports no metadata at all still canonicalizes to its own URL instead of inheriting the homepage's.         |

`canonicalUrl()` in `src/lib/seo.ts` is the single formatter behind the canonical tag, `og:url`,
`sitemap.xml` and JSON-LD: it drops query strings and hashes (`/trips?page=2` → `/trips`), collapses
duplicate and trailing slashes, percent-encodes segments, and renders the homepage as the bare
origin. Because the sitemap is written with the same helper, an entry and the canonical of the page
it points at are always the identical string.

The 404 page is the deliberate exception — it emits no canonical (the URL it is served at does not
exist) and is `noindex`.

**Adding a page:** export `generateMetadata` and return
`buildMetadata({ …, path: sitePath('/your/path') })`. `npm test` fails if a page under
`src/app/(frontend)` does not: `src/lib/canonical-coverage.test.ts` audits the route tree, so the
rule holds for pages written later, not just the ones written today.

### Sitemap and robots

`/sitemap.xml` is served by `src/app/sitemap.ts`, which reads the published content and hands it to
`buildSitemap()` in `src/lib/sitemap.ts`. The list covers the homepage, the three listing pages,
`/inquiry` and every published trip, destination, post and CMS page — each URL **exactly once**:

| Rule                                             | Why                                                                                                                                                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URLs come from `canonicalUrl()`                  | A sitemap entry and the canonical of the page it points at are the identical string, so a crawler can never be sent to a spelling the page disavows.                                                                             |
| `<lastmod>` is the document's `updatedAt`        | A lastmod that always says "now" is noise crawlers learn to ignore; the homepage and the listing pages use the newest update of what they actually render. A URL with no real date carries no `<lastmod>` at all.                |
| `meta.noIndex` documents are skipped             | A page told to stay out of the index must not be advertised in the sitemap — that contradiction is what Search Console reports as an error.                                                                                      |
| A CMS page whose slug a route owns is not listed | `home` is served at `/`, `trips` at `/trips`, and so on (`src/lib/site-routes.ts`, shared with `[slug]/page.tsx`). Listing the page anyway would print a URL the sitemap already contains.                                       |
| Publishing rebuilds it immediately               | Payload's revalidation hooks purge `/sitemap.xml` next to the page they changed, so a trip published now is in the sitemap now — not after the 1-hour fallback window. `npm test` covers the rules in `src/lib/sitemap.test.ts`. |

`/robots.txt` (`src/app/robots.ts`) is the other half: it allows everything except `/admin`, `/api/`
and `/preview/`, sets `Host`, and points crawlers at the sitemap.

### Keywords

Trips and Blog posts have a **Keywords** panel — a chip input where the editor types the phrases
the page is trying to rank for (press Enter after each one, up to 20). The list lives on the
document (`trip.keywords`, `post.keywords`, per language) and is published in three places:

| Where | What it becomes |
| ----- | --------------- |
| `<head>` | `<meta name="keywords" content="…">` |
| Open Graph | `article:tag` on blog posts (`og:type=article` only — the tag is not valid elsewhere) |
| JSON-LD | `keywords` on the `TouristTrip` / `BlogPosting` node |

`normalizeKeywords()` in `src/lib/seo.ts` trims, collapses whitespace, splits a pasted
comma/newline list, de-duplicates case-insensitively and caps the result at `MAX_KEYWORDS`, so the
output is the same whether an editor used the chip input or pasted a spreadsheet column. Google has
ignored the meta tag as a ranking signal for years; treat the list as a record of intent that keeps
the title, the copy, Bing/Yandex and internal search pointed at the same terms.

### Open Graph and structured data

Every page builds its metadata with `buildMetadata()` — canonical, `og:*`, `twitter:*`, robots — and
renders JSON-LD from the builders in `src/lib/seo.ts`. Images always go through `imageUrl()` /
`schemaImageUrl()`, which turn a Media document into an **absolute** URL: schema.org drops relative
ones.

| Page | Open Graph | JSON-LD |
| ---- | ---------- | ------- |
| `/` | `website` + default share image | `Organization`, `WebSite` (with `SearchAction`), `FAQPage` when the block is used |
| `/trips`, `/blog`, `/destinations` | `website` | `BreadcrumbList` + `CollectionPage` whose `ItemList` is the cards the page renders |
| `/trips/[slug]` | `website` + trip hero | `BreadcrumbList`, `TouristTrip` (offer, itinerary, duration, keywords), `FAQPage` |
| `/blog/[slug]` | `article` + `article:published_time` / `modified_time` / `tag` | `BreadcrumbList`, `BlogPosting` (author, `articleSection`, `wordCount`, keywords), `FAQPage` when the post has FAQs |
| `/destinations/[slug]` | `website` + region hero | `BreadcrumbList`, `TouristDestination` (geo, country) |
| `/inquiry` | `website` | `BreadcrumbList`, `ContactPage` |
| any CMS page (`/[slug]`) | `website` + page image | `BreadcrumbList`, `WebPage` |
| `/inquiry/thank-you`, 404 | — | — (both `noindex`, so nothing is offered to the index) |

The root layout adds site-wide `og:site_name`, `og:locale` and a default share image for routes that
return no metadata of their own. Note that a route returning its own `openGraph` block replaces that
one wholesale — Next.js does not merge it key by key — so pages that want the site default pass
`settings.defaultOgImage` explicitly.

`src/lib/structured-data.test.ts` audits the route tree: add a page without JSON-LD, or hand a
relative image URL to a builder, and `npm test` fails with the file name.

Every URL is built from `NEXT_PUBLIC_SITE_URL`, so point it at the production origin before
deploying.

## Analytics (GA4)

The Google tag lives in the root layout, `src/app/(frontend)/layout.tsx`, inside `<head>` — the
Next.js equivalent of pasting the snippet immediately after the opening `<head>` tag. The root
layout wraps every public page, so the tag is emitted on `/`, `/trips`, `/trips/[slug]`, `/blog`,
`/destinations`, `/inquiry` and every CMS page.

The snippet is the verbatim contents of [`gtag.txt`](gtag.txt) at the repo root (measurement ID
`G-WWQBTLKKBW`). Keep the two in sync, or change both together.

**Verify the tag is actually being served** — this is the only check that matters, because it is
exactly what Google's own checker does (a plain HTTP GET of the page):

```bash
curl -sSL https://www.hikeglobally.com/ | grep -c G-WWQBTLKKBW
```

`2` (one `<script src>` + one `gtag('config', …)`) means it is live. `0` means Google will not see
it either.

### "Google Analytics says it can't detect the tag"

If the `curl` above returns `0` while the code is unchanged, the request is not reaching Next.js at
all — something in front of the app is answering instead. The cause is almost always a bot-protection
layer:

- **Cloudflare.** A managed challenge or Bot Fight Mode returns `HTTP 403` with a
  `cf-mitigated: challenge` response header and a `Just a moment...` page body instead of your HTML.
  Google's tag checker cannot solve that challenge, so it reports the tag as missing. Fix it in the
  Cloudflare dashboard: **Security → Bots** (turn off Bot Fight Mode, or switch it to allow verified
  bots), **Security → Settings → Security Level** (Medium, not "I'm Under Attack"), and check
  **Security → WAF** for a custom rule set to _Managed Challenge_. Then re-run the `curl` above.
- **Vercel Deployment Protection.** Applies to preview deployments by default, and can be enabled for
  production. Turn it off for production, or Google's fetcher gets a login wall.
- **Wrong host in the data stream.** The GA4 data-stream URL must match the host the site actually
  serves on. `hike-globally-final-project.vercel.app` 308-redirects to `www.hikeglobally.com`, so
  `www.hikeglobally.com` is the production host.

Note that a challenge here is not only an analytics problem: it blocks Googlebot the same way, so it
also stalls indexing of the sitemap.

## Deployment

Vercel + hosted Postgres + Vercel Blob for media (without a Blob store the deployment falls back to
Postgres storage — see [Media storage](#media-storage)). See
[§9 of the implementation plan](docs/IMPLEMENTATION-PLAN.md#9-deployment); the short version is
`npm ci && npm run migrate && npm run build`, with the four environment variables above set.
