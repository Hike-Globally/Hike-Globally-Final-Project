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

**A Blob store connected in the dashboard is not automatically `BLOB_READ_WRITE_TOKEN`.** Vercel names
the variable after the store — this project has `HikeGlobally_READ_WRITE_TOKEN` — so the mode stays
`database`, the startup log says no external storage is configured, and every upload lands in
Postgres while the Blob store sits empty. That is deliberate: files already in Postgres are served
only by the database adapter, so flipping the mode because a variable was renamed would 404 every
image already on the site. `src/lib/media-storage.ts` now says which variable it found and what to do:

```
[media] storage mode: database — … (set BLOB_READ_WRITE_TOKEN to move them to Vercel Blob)
        — HikeGlobally_READ_WRITE_TOKEN is present but this app reads BLOB_READ_WRITE_TOKEN;
          rename it, or set MEDIA_STORAGE=blob to switch once existing files are moved to the store
```

To move to Blob: rename the variable to `BLOB_READ_WRITE_TOKEN` in Vercel (Settings → Environment
Variables), re-upload the existing media through the admin (an upload re-writes the row and its URL),
then drop `MEDIA_STORAGE` if you set it.

## Scripts

| Script                                                           | Description                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `dev` / `build` / `start`                                        | Next.js                                                                                                                     |
| `typecheck`                                                      | `tsc --noEmit`                                                                                                              |
| `test`                                                           | Node's built-in runner — URL/canonical helpers, media storage, globe projection, and a route audit that every page declares its own canonical |
| `lint`                                                           | ESLint                                                                                                                      |
| `migrate` / `migrate:create` / `migrate:status` / `migrate:down` | Payload migrations                                                                                                          |
| `generate:types`                                                 | Regenerate `src/payload-types.ts` after a schema change                                                                     |
| `generate:importmap`                                             | Regenerate the admin import map (also runs on `postinstall`)                                                                |
| `seed`                                                           | Load the demo content                                                                                                       |
| `generate:globe-dots`                                            | Regenerate the About globe's land-dot field from Natural Earth data (`world-atlas`)                                         |

## Design tokens

Headings **Instrument Serif 400**, body **Archivo** (self-hosted variable fonts). The single
source of truth is `src/app/(frontend)/globals.css`.

| Token   | Hex       |
| ------- | --------- |
| `ink`   | `#183144` |
| `deep`  | `#2177b5` |
| `slate` | `#79706d` |
| `sage`  | `#d0564d` |
| `mist`  | `#f6f6f6` |

### Heroes

Every page opens with one hero band and they all render identically — the homepage's hero is the
site's hero, not a special case:

| Class              | What it is                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `.hero-region`     | The band: exactly one viewport tall (`--hero-min-height: 100svh`), never shorter than its copy.  |
| `.hero-title`      | The h1: the display face at `min(clamp(42px … 72px), 53svh - 14.25rem)` — 42px on a phone, 72px on a desktop, capped by height so a short screen keeps the copy visible. |
| `.hero-title i`    | The italic accent line an editor writes as `<i>…</i>` in a heading — `display: block`, so it is always the second line. |
| `.hero-description`| The standfirst: the lead role (17px → 18px, 1.7).                                                |

They cover the homepage, CMS `hero` blocks, `/trips`, `/destinations`, `/blog`, the trip /
destination / article mastheads and the page header behind `/inquiry`. Use them (not a bespoke
size) for any hero added later; the values live in `@theme` as `--hero-min-height`,
`--hero-title-size` and `--hero-title-accent-size`.

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

`/robots.txt` (`src/app/robots.ts`) is the other half: it allows everything except `/admin`, `/api/`,
`/preview/` and `/cdn-cgi/`, sets `Host`, and points crawlers at the sitemap.

### Email links and Cloudflare Email Address Obfuscation

If Semrush (or Ahrefs, Screaming Frog, or Search Console) reports
`https://hikeglobally.com/cdn-cgi/l/email-protection` as a **broken internal link on every page**, the
site is not broken — Cloudflare is rewriting the `mailto:` links. Email Address Obfuscation is on by
default on every Cloudflare zone: at the edge it replaces each address with a
`<a href="/cdn-cgi/l/email-protection#…">` placeholder, injects `email-decode.min.js` to put the real
address back in a browser, and moves on. Humans with JavaScript see a working link; crawlers that
read HTML without running that script follow a path with nothing behind it, which is why the footer
(and therefore every page) carries that one "broken" URL.

The fix is in the markup, in `src/lib/public-email.ts`, and it does not need the dashboard:

| Layer                   | Where                          | What it does                                                                                                                                                                                    |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Opt the address out     | `src/lib/public-email.ts`      | Renders the visible address as `<a href="mailto:…"><!--email_off-->you@example.com<!--/email_off--></a>`. Cloudflare documents that it leaves addresses inside those comments alone, so the `mailto:` survives and crawlers get a link they understand. |
| Keep crawlers off it    | `src/app/robots.ts`            | `Disallow: /cdn-cgi/` covers any address an editor pastes into rich text, where we do not control the surrounding markup.                                                                       |
| Redirect the leftovers  | `next.config.mjs`              | `/cdn-cgi/l/email-protection` → 308 `/contact`, for URLs already in an index or a bookmark.                                                                                                      |

Two implementation details matter and are easy to undo by accident:

- **The label is HTML, not a JSX text node.** React drops comment nodes, so `{settings.email}` can
  never carry the `email_off` pair. Every public address is rendered through
  `protectedEmailHtmlProps(email)`, which pairs the markers with `dangerouslySetInnerHTML`.
  `npm test` enforces both this and "no hand-written `` `mailto:${…}` ``" in
  `src/lib/public-email-usage.test.ts`, so a new component cannot quietly reintroduce the placeholder.
- **Do not paste the address into a `title=`, `alt=` or `aria-label=`** if avoiding scraping matters.
  Cloudflare explicitly does not obfuscate addresses in tag attributes, so those are already exposed.

Turning the feature off in Cloudflare is still worthwhile and takes a moment — **Security → Settings →
Email Address Obfuscation → Off** (or `PATCH …/zones/<zone>/settings/email_obfuscation` with
`{"value":"off"}`). The markup above is correct either way; the dashboard toggle additionally stops
`email-decode.min.js` from loading. Verify with a plain GET, which is what a crawler does:

```bash
curl -sSL https://www.hikeglobally.com/ | grep -c 'cdn-cgi/l/email-protection'   # expect 0
curl -sSL https://www.hikeglobally.com/ | grep -o 'href="mailto:[^"]*"'          # expect the address
```

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

### Internal linking

The keyword list does a second job. On blog posts, trip pages, destination pages and CMS pages, a
mention of another document's phrase in running copy becomes a real link to it — no editor action,
and nothing written back into the CMS.

| Rule | Why |
| ---- | --- |
| Phrases come from `keywords`, then the title, then the slug | An editor-typed keyword is trusted as written; a derived phrase has to be two words and free of generic edges ("Best Treks in Nepal" is a heading, not an anchor). |
| Longest phrase wins, first mention only, one link per target per page | Repeating an anchor text, or linking the same URL twice, is the pattern that reads as manipulation. |
| At most 8 links per page, at least 140 characters of copy apart | Past that the value per link drops and clusters of adjacent anchors read as a link farm. |
| Trips and destinations outrank posts when the budget runs out | The pages the operator earns from take the anchor. |
| Headings, lists, quotes, tables, captions and existing links are never touched | The article outline is built from heading text, the rest is data or verbatim copy — and a link an editor placed by hand always wins. |
| Anchor text is the copy exactly as written | Rewriting it to the target's title is what Google's spam policy targets. |

Linking happens **at render time, not at save time**: `src/lib/internal-links.ts` compiles the
published documents into a phrase index, one `InternalLinker` per page render decides which mentions
win under the budget, and the `text` branch of `src/components/content/rich-text.tsx` emits the
`<a>`. The CMS content is never modified, so a renamed slug cannot leave a dead link behind —
`src/hooks/revalidate.ts` purges the index along with the pages that read it — and switching the
feature off is deleting four wrapper components.

It is wired on the four detail routes: each awaits one `createInternalLinker({ collection, id })` and
threads it down to every rich text block on the page, so they share one budget and the page cannot
link to itself. With no database configured it yields an empty linker and every page renders
byte-for-byte as it did before. Full design, rules, limitations and the verify-after-deploy `curl`:
**[docs/internal-linking.md](docs/internal-linking.md)**. `npm test` covers the engine and the
rendered markup in `src/lib/internal-links.test.ts`.

### Redirections

**Admin → SEO → Redirections** manages the rules that send an old URL to its new home. Each rule
is one row in the `redirections` table: a source path, a destination (an internal path or a full
`http(s)` URL), a status code (`301`, `302`, `307` or `308`), an active flag and an optional note.
Deactivating a rule keeps it without serving it.

| What an admin gets | Where it lives |
| ------------------ | ---------------------------------------------------------------------------------------- |
| List with search, sortable columns, pagination, quick status/active filters | Payload's list view + `src/components/admin/redirections-toolbar.tsx` |
| Activate/deactivate in place, edit and delete (with confirmation) on each row | `redirection-active-cell.tsx`, `redirection-row-actions.tsx` |
| Bulk activate / deactivate / delete selected | `/api/redirections/bulk` |
| CSV import & export (`source,destination,status_code,is_active,note`) with an added/skipped/failed summary and reasons | `/api/redirections/import`, `/api/redirections/export` |
| Live loop/chain feedback while editing | `/api/redirections/analyse`, `redirection-check-field.tsx` |

**Matching.** The proxy (`src/proxy.ts`) compares the incoming *path* — lowercased, with the
trailing slash dropped — against the active rules. The visitor's query string is kept and appended
to the destination (`/old?utm=x` → `/new?utm=x`), and the stored status code is used for the
response. Admin, API, `_next`, `images`, `media`, `preview`, `robots.txt`, `sitemap.xml`, the
homepage and anything with a file extension never take part.

**Validation.** A rule is refused when the source is duplicated, when it points at itself, when it
would create a loop (A→B with B→A, or longer cycles) or when the source is a system route. A
*chain* (A→B while B→C exists) is allowed but the editor is told to point A straight at C.
`src/lib/redirections.ts` holds these rules as pure functions; the Payload hook, the live form
hint, the CSV import and the tests all call the same code.

**Caching.** The proxy keeps the compiled rule map in memory and refreshes it from
`GET /api/redirections/rules` once per TTL (`REDIRECTIONS_CACHE_TTL_MS`, 30 s default). Saving,
deleting or bulk-updating a rule clears the cache of the process that handled the write, and purges
the `redirections` revalidation tag — but the proxy is bundled separately from the routes, so its
copy is refreshed by the TTL: expect a saved rule to go live within 30 s (and a deactivated one to
stop serving within 30 s) rather than instantly. Lower `REDIRECTIONS_CACHE_TTL_MS` if a site needs
that tighter; it is the only dial. Hit counters are batched in memory and written by
`POST /api/redirections/hit` — a redirect never waits for a write.

Apply the schema with:

```bash
npm run migrate          # applies 20261108_150000_redirections
npm run migrate:status   # confirm it is recorded
```

`npm run build` already runs the migrations before `next build`, so a deploy needs no extra step.

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
Postgres storage — see [Media storage](#media-storage)). `package.json` pins `engines.node` to
`24.x` and `.nvmrc` says `24`: an open-ended range lets Vercel ignore the project's own Node setting
and build on the newest major (26.x at the time of writing), which is a build nothing here has been
tested against. A Blob store named after the project arrives as `HikeGlobally_READ_WRITE_TOKEN`;
that is reported at startup rather than silently used, because switching storage would strand the
files already in Postgres (see [Media storage](#media-storage) for the two-line fix). See
[§9 of the implementation plan](docs/IMPLEMENTATION-PLAN.md#9-deployment); the short version is
`npm ci && npm run build`, with the four environment variables above set. `npm run build` applies
pending migrations **before** it builds (`payload generate:importmap && node
scripts/migrate-for-build.mjs && next build`), so a deploy can never ship against an outdated
schema — and the build's own workers find nothing left to migrate. With no connection string
configured that step skips itself and says so, because a build without a database attached has to
keep working (`src/lib/data.ts` falls back to static content in exactly that state — a Preview
deployment, or a first deploy before the environment variables exist). A database that *is*
configured but unreachable fails the build instead of being quietly skipped.

Payload *also* applies migrations on every production boot (`prodMigrations` in
`src/payload.config.ts`), which is a safety net rather than the plan, because a boot is not a
one-off event: `next build` collects page data with several workers, each of which opens its own
Payload connection, and a fresh deployment's first requests can land on more than one instance.

Those boots are **serialised across processes** (`src/lib/migration-guard.ts`). Each migration takes
a Postgres **transaction-scoped** advisory lock keyed on its filename and re-checks
`payload_migrations` inside it, so exactly one process migrates and the rest no-op. Transaction
scope is the detail that matters: Payload writes the `payload_migrations` row *after* `up` returns
and commits after that, so a lock released inside `up` is released while the row is still invisible
to everybody else — the next process would re-run the same DDL. Postgres drops a transaction-scoped
lock at COMMIT/ROLLBACK on its own, which is exactly the right moment. A process waiting for the
lock also re-checks `payload_migrations` on every poll and returns as soon as the row appears, so a
stuck lock costs one poll round instead of the whole timeout.

Both failure modes this prevents are real, not theoretical: unwrapped, the workers all saw the same
"not yet migrated" list and ran the same `ALTER TABLE` at once, and the losers died with
`column "…" already exists` (`0ace700`'s deploy); with a session-level lock, two workers spent the
full 120s unable to take it and exited, failing the build (2026-11-07). Migration files need no
changes of their own: anything added to `src/migrations/index.ts` is covered automatically.

**Nothing but migrations may sit in `src/migrations/`.** `payload migrate` imports *every* `.ts` /
`.js` file in that directory (`readdirSync` plus an extension filter) and names each one after the
text before its first dot — so a co-located `20261107_120000_trip_audience.test.ts` was loaded *next
to* its migration: same name, no `up`, and Node's test runner started inside the CLI. `npm run
migrate` printed TAP output and then never exited, and because `migrate-for-build.mjs` waits for that
child process, the deploy hangs instead of failing. Migration tests therefore live in
`src/migrations/tests/`, which the directory scan skips, and `npm test` points at that folder. Keep
it that way: a `*.test.ts` file in `src/migrations/` breaks the migration command.

A boot-time repair (`src/lib/schema-repair.ts`) also completes the trip brochure columns if a
database has the migration recorded but is missing some of its columns — the state the failed build
left behind. On a healthy database it costs one catalogue query and no DDL.

`npm run build` runs `payload generate:importmap` and the migration step before `next build`. Vercel caches
`node_modules`, and the import map (`src/app/(payload)/admin/importMap.js`) is deliberately not
committed — regenerating it in the build step is what keeps a cache-hit install from failing with
`Module not found: Can't resolve './admin/importMap'`.

### Node version is pinned, not ranged

`package.json` declares `"engines": { "node": "24.x" }`. A range such as `">=20.9.0"` makes Vercel
ignore the Node version in Project Settings and build on the newest major it has — the build log says
so explicitly —

```
Warning: Due to "engines": { "node": ">=20.9.0" } in your `package.json` file, the Node.js Version
defined in your Project Settings ("24.x") will not apply, Node.js Version "26.x" will be used instead.
```

— so the runtime your build was tested against and the one it deploys on drift apart whenever Vercel
adds a major. That is the classic "it built last week, it fails today" deploy failure. Pinning the
major keeps the build, the function runtime and Project Settings on the same version. `npm ci` on the
build image then installs it, and the warning disappears.

### `@payloadcms` packages must all be the same version

`payload`, `@payloadcms/db-postgres`, `@payloadcms/next`, `@payloadcms/richtext-lexical`,
`@payloadcms/ui`, `@payloadcms/storage-vercel-blob` and `@payloadcms/plugin-cloud-storage` are
pinned to the same `3.90.2` on purpose, and `patches/` contains `patch-package` diffs against that
exact version. Bumping one of them — or letting a `^` range resolve a newer one — is a deploy
failure waiting to happen: `patch-package` fails the `postinstall` step when the patched file is not
the shape it expects, and the build stops before `next build` starts. Change them together, then run
`npx patch-package` and refresh the patches in the same commit.

### Commit author must be a real GitHub account

Vercel refuses to deploy a commit whose author email it cannot map to a GitHub account. The push
succeeds, but the deployment is blocked before the build starts with _"GitHub couldn't verify an
account for the commit"_ / _"The commit author email is not a valid email address"_, so the live
site silently keeps the previous build. Bot addresses such as `agent@arena.ai` or
`probe@arena.local` do exactly that (`fe87b32` and `2c7e039` on this repo are real examples), so
every commit — human or automated — must be authored with an address tied to the account that owns
this repo:

```bash
git config user.name  "Hike-Globally"
git config user.email "337236695+Hike-Globally@users.noreply.github.com"
```

The numeric `ID+USERNAME@users.noreply.github.com` form is preferred because GitHub keeps it stable
even after the account's email privacy setting changes. Run `git log -1 --pretty='%an <%ae>'` to
check the identity of the commit you are about to push — rewriting the author of an already-pushed
commit requires a force-push and a new PR.

Before pushing, run the guard that encodes this rule:

```bash
npm run verify:commit-author                     # the commit Vercel would build (HEAD)
npm run verify:commit-author origin/main..HEAD   # every commit on the branch
```

It exits non-zero and prints the exact `git config` fix when it finds an author address Vercel
cannot verify, instead of leaving a blocked deployment behind.

Only the tip of a push is built, so a merge commit authored by the verified account deploys even
when one of the commits it merges came from a bot — that is why the direct pushes `fe87b32` and
`2c7e039` were blocked while the surrounding merge commits deployed. Pushing through a pull
request therefore always deploys; pushing directly does not.

#### If a pushed commit has a bad author

Vercel reads the author of each commit, so an existing commit with a bot address keeps failing that
deployment. Either push a new commit with a good identity (Vercel then deploys the new head) or
re-stamp the bad commit:

```bash
git rebase --exec 'git commit --amend --no-edit --reset-author' origin/main
git push --force-with-lease origin <branch>
```

For any other commit already on the branch, `git filter-repo --commit-callback` or an interactive
`rebase --root` does the same job. Only rewrite commits that are not yet on `main`.
