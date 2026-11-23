# Hike Globally

Website for a Himalayan trekking operator — **Next.js 16 App Router +
Payload CMS 3 + PostgreSQL**, in a single deployable application.

- Public site uses **English** at plain URLs: `/`, `/trips`, `/destinations`, `/blog` and their
  detail pages. Legacy `/en`, `/de` and `/fr` URLs 308-redirect to the same page without a prefix.
- CMS: Payload admin at `/admin`, drafts + versions + role-based access control.
- Content saved in the CMS appears on the site immediately (tag-based on-demand revalidation).

Full architecture, data model, caching strategy and trade-offs: **[docs/architecture/implementation-plan.md](docs/architecture/implementation-plan.md)**.
Editor-facing feature guides, design standards and runbooks: **[docs/](docs/README.md)**.

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
source of truth is `src/app/(frontend)/globals.css`. The homepage hero's first line is the one
exception: `Cal Sans 400` (also self-hosted), under which the Instrument Serif italic accent line
sets the second line.

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
`sitemap.xml` and JSON-LD: it drops filters, tracking parameters and hashes, preserves archive page numbers, collapses
duplicate and trailing slashes, percent-encodes segments, and renders the homepage as the bare
origin. Because the sitemap is written with the same helper, an entry and the canonical of the page
it points at are always the identical string.

The 404 page is the deliberate exception — it emits no canonical (the URL it is served at does not
exist) and is `noindex`.

**Adding a page:** export `generateMetadata` and return
`buildMetadata({ …, path: sitePath('/your/path') })`. `npm test` fails if a page under
`src/app/(frontend)` does not: `src/lib/canonical-coverage.test.ts` audits the route tree, so the
rule holds for pages written later, not just the ones written today.

### Author profile pages

Every account in **Team → Users** has a public landing page at `/authors/<slug>`, and `/authors`
is the index that links to all of them. This is the piece that turns a byline into an entity a
search engine can follow: a `Person` structured-data node used to point at the author's own
homepage (or a social profile), which left every article attributed to a name rather than to a
page on this site.

| Rule | Why |
| --- | --- |
| **`slug` lives on the user, is required and unique** | The profile URL is an address, not a display field. `ensureUniqueUserSlug` (`src/hooks/user-slug.ts`) appends `-2`, `-3`, … when two editors share a name, so the second save cannot fail a constraint the admin never sees. |
| **Every account gets a page, including ones created later** | `generateStaticParams()` prerenders the profiles that exist at build time and `dynamicParams` stays on, so an editor added after the last deploy gets a live URL on first request — the same contract a trip published after the build has. |
| **A bare account is `noindex`** | No bio and no published work means nothing to say. The page still renders (a byline must always be able to link to it), but it stays out of the index and out of the sitemap. `isIndexableAuthor()` is the single rule, so the page's robots meta and the sitemap cannot disagree. |
| **`Person.url` is the profile page, not the author's website** | `personJsonLd()` points the node at `/authors/<slug>`, which is the page *about* the person. The personal site and socials move to `sameAs`, where they belong — pointers to the same person elsewhere. |
| **`ProfilePage` markup, with the same `Person` as `mainEntity`** | A crawler reading a post, its author card and the author page resolves all three to one entity instead of three names that happen to match. |
| **Only public fields are ever read** | `authorSelect` in `src/lib/data.ts` selects name, slug, bio, avatar, job title, education, credentials, website and socials — nothing else. A `users` document also holds `email`, `hash`, `salt` and `sessions`, and the Local API defaults `overrideAccess` to true, so this allow-list is what keeps a password hash out of the render *and* out of the Data Cache. |
| **A user save revalidates their page** | `revalidateAuthor` purges `/authors/<slug>`, the `/authors` index, the author tags and `/sitemap.xml`. A slug rename purges the old address too, so a moved profile never keeps serving a URL that no longer exists. |

Migration `20261123_120000_user_profile_slug` adds the column, backfills a readable slug from each
existing `name` (de-duplicating in `id` order, so the first account keeps the clean URL), and only
then creates the unique index. Run `npm run migrate` before starting the updated app — the standard
build already does this when a database is configured.

The byline card on a post and on a trip (`src/components/content/author-profile.tsx`) links the
author's name to this page, so every article hands its author a crawlable internal link.

### Catalog discovery

`/trips`, `/destinations`, and `/blog` serve 24 published records per page. Server-rendered
Previous/Next links lead to URLs such as `/trips?page=2`; page one uses the bare archive URL.
Filtering and ordering happen before pagination. Neither a browser interaction nor the sitemap
is required to discover the next batch. Detail-route slug guards and build-time params read
all published slugs in stable ID order, not just the first 1,000. Menu and homepage previews
remain intentionally bounded.

### Sitemap and robots

`/sitemap.xml` is served by `src/app/sitemap.ts`, which reads the published content and hands it to
`buildSitemap()` in `src/lib/sitemap.ts`. The list covers the homepage, the three listing pages,
`/inquiry`, `/authors` and every published trip, destination, post, CMS page and author profile —
each URL **exactly once**:

| Rule                                             | Why                                                                                                                                                                                                                              |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URLs come from `canonicalUrl()`                  | A sitemap entry and the canonical of the page it points at are the identical string, so a crawler can never be sent to a spelling the page disavows.                                                                             |
| `<lastmod>` is the document's `updatedAt`        | A lastmod that always says "now" is noise crawlers learn to ignore; the homepage and the listing pages use the newest update of what they actually render. A URL with no real date carries no `<lastmod>` at all.                |
| `meta.noIndex` documents are skipped             | A page told to stay out of the index must not be advertised in the sitemap — that contradiction is what Search Console reports as an error.                                                                                      |
| A CMS page whose slug a route owns is not listed | `home` is served at `/`, `trips` at `/trips`, and so on (`src/lib/site-routes.ts`, shared with `[slug]/page.tsx`). Listing the page anyway would print a URL the sitemap already contains.                                       |
| Publishing rebuilds it immediately               | Payload's revalidation hooks purge `/sitemap.xml` next to the page they changed, so a trip published now is in the sitemap now — not after the 1-hour fallback window. `npm test` covers the rules in `src/lib/sitemap.test.ts`. |

**Images and videos use this same sitemap**, not a second endpoint. Next.js emits the image/video
namespaces automatically. Entries include original hero/featured images on trips, destinations and
posts, visible trip galleries, the first four destination gallery items (matching the page), and
hero/gallery blocks on CMS pages. The homepage uses its actual bundled hero image; its CMS media
is attached to `/`, never `/home`. Hidden sections, PDFs, unresolved upload IDs, and noindex
content do not contribute media. Inline rich-text uploads and third-party embeds are not included.

`src/lib/sitemap-records.ts` reads published documents in batches of 200 with media and video
thumbnails populated; it does not fetch each page or make slug lookups heavier. The result is
cached for an hour and invalidated on content publishes and media changes/deletes. Original URLs
are absolute (including external storage URLs), deduplicated, and XML-escaped; image lists are
limited to 1,000 images per landing page.

**For a video entry:** in **Library → Media**, open the video, set **Alt** to its real title,
write an accurate **Caption** describing the clip, and choose a representative still in
**Video thumbnail**. The still also appears as the video player's poster. A video is omitted until
all three fields and its file URL are available—no made-up thumbnail, description, duration, or
publication date. Google still decides whether to index or display a video; a gallery video is not
guaranteed a video search result.

Migration `20261120_190941_sitemap_video_thumbnail` adds one nullable thumbnail relation and index
to Media. It does not delete or rewrite existing content. Run `npm run migrate` before starting the
updated app (the standard build already runs it when a database is configured). Use an isolated
preview database. To verify after deployment, inspect `/sitemap.xml` for `image:image` and, after
completing a video's metadata, `video:video`. For external storage, verify the CDN is crawlable and
verify that domain in Search Console when applicable. Submit `/sitemap.xml` in Search Console;
its discovery extensions do not guarantee indexing or higher rankings.

`/robots.txt` (`src/app/robots.ts`) allows public pages and **`/api/media/file/`** (the public
image/video file endpoint). The rest of `/api/`, `/admin`, `/preview/` and `/cdn-cgi/` remain
blocked. This narrow exception is essential: advertising an upload in a sitemap is useless if
robots.txt forbids fetching its bytes. Robots rules are crawler guidance, not access control.

### Blog RSS feed

`/feed.xml` is an **RSS 2.0** subscription feed with the latest **50 published, indexable blog
posts**, newest publication first. Every public page advertises it with a
`<link rel="alternate" type="application/rss+xml">` in the root head, so readers can discover it
even when a page replaces its own metadata/canonical. Subscribe using
`https://hikeglobally.com/feed.xml` (or the origin configured in `NEXT_PUBLIC_SITE_URL`).

Items contain a title, canonical article link, stable permalink GUID, plain-text excerpt (safely
encoded for RSS readers), and the actual publication date (`createdAt` only as the fallback).
Edits retain the GUID and publication date; the channel's `lastBuildDate` comes from real record
dates, not the generation clock. Drafts, noindex posts, malformed entries, and duplicate URLs are
excluded. No full article bodies, private author emails, or demo fallback posts are syndicated.
With no database/posts, the endpoint remains a valid empty feed.

The feed is cached for an hour, with immediate invalidation on public blog publishes, edits,
renames, unpublishes and deletions, and on site-settings changes. Draft autosaves leave the public
feed alone. The endpoint is not a landing page and is not included in the page sitemap. No schema
change or migration is needed. Tests cover XML escaping, dates, ordering/limits, filtering,
canonical GUIDs, query access, discovery, and the real revalidation hooks.

After deployment, fetch `/feed.xml` and check the `application/rss+xml; charset=utf-8` content
type, then inspect a blog page's head for the alternate link. This helps subscriptions and content
discovery; it does not guarantee indexing or higher search rankings.

### llms.txt

`/llms.txt` is the same site described to a language model instead of to a crawler. The proposal at
[llmstxt.org](https://llmstxt.org) asks for one Markdown file at the root: an `#` heading naming the
site, a blockquote summary, a few paragraphs of detail, then `##` sections of links an assistant can
follow instead of crawling every page.

**It is generated, not checked in.** Two thirds of the file is a list of published trips,
destinations, posts and pages, so a hand-written copy would be wrong the moment an editor publishes
something — the failure mode the sitemap avoids by being a route. `src/app/llms.txt/route.ts` serves
it; `src/lib/llms-txt.ts` owns the rules:

| Rule                                          | Why                                                                                                                                                                                                |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Links come from `canonicalUrl()`              | A line here and the page's `<link rel="canonical">` are the identical string, so no two lists can disagree about a URL.                                                                            |
| Only published, indexable documents           | Drafts and anything whose SEO panel is set to noindex are skipped — the sitemap's rule. A file that advertises a URL the site hides is worse than no file.                                         |
| A CMS page whose slug a route owns is skipped | `home`, `about`, `trips` … already have a URL; printing `/${slug}` for them would list a duplicate. The About and Contact entries come from the route table.                                       |
| Every line carries its own facts              | A trip prints type, duration, difficulty, maximum altitude and price before its summary; a destination its tagline; a post its excerpt — enough for a model to decide which page is worth opening. |
| Rebuilt on publish                            | Payload's revalidation hooks purge `/llms.txt` next to `/sitemap.xml` (`src/hooks/revalidate.ts`), so a trip published now is in the file now rather than after the 1-hour fallback window.        |

The prose at the top — what the site is, what a trip page contains, how to make contact — lives in
`buildLlmsTxt()` in `src/lib/llms-txt.ts`. The heading, blockquote and contact address come from the
CMS settings, so renaming the site or editing the tagline in the admin changes the file too.

`npm test` covers it in `src/lib/llms-txt.test.ts`: one line per published URL, canonical spelling,
nothing noindex, no empty sections, and copy that is long or multi-line can never break the list it
sits in. Check a running site with:

```bash
curl -s http://localhost:3000/llms.txt
```

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

**This list is not the linking list.** Automated internal linking reads a separate
**Keyword For Internal Linking** panel on the same document (see below): the phrases there — not
these — become anchors, so a page can target one set of search terms and be linked by another.

### Internal linking

Every document has a second chip list, **Keyword For Internal Linking**. The phrases an editor puts
there are the ones that become anchors: on blog posts, trip pages, destination pages and CMS pages, a
mention of one of those phrases in running copy becomes a real link to the document — with nothing
written back into the CMS. The list is the only source; the SEO keywords, title and slug are not
inferred, and an empty list means the page is never linked to.

| Rule | Why |
| ---- | --- |
| Phrases come only from the **Keyword For Internal Linking** panel | Nothing is inferred from the SEO keywords, the title or the slug. The panel is the switch: fill it to link to the page, clear it to stop. A phrase may be a short acronym or a generic-sounding heading — a human chose it. |
| Longest phrase wins, first mention only, one link per target per page | Repeating an anchor text, or linking the same URL twice, is the pattern that reads as manipulation. |
| At most 8 links per page, at least 140 characters of copy apart | Past that the value per link drops and clusters of adjacent anchors read as a link farm. |
| Trips and destinations outrank posts when the budget runs out | The pages the operator earns from take the anchor. |
| Headings, lists, quotes, tables, captions and existing links are never touched | The article outline is built from heading text, the rest is data or verbatim copy — and a link an editor placed by hand always wins. |
| Anchor text is the copy exactly as written | Rewriting it to the target's title is what Google's spam policy targets. |

Linking happens **at render time, not at save time**: `src/lib/internal-links.ts` compiles the
published documents' panels into a phrase index, one `InternalLinker` per page render decides which mentions
win under the budget, and the `text` branch of `src/components/content/rich-text.tsx` emits the
`<a>`. The CMS content is never modified, so a renamed slug cannot leave a dead link behind —
`src/hooks/revalidate.ts` purges the index along with the pages that read it — and switching the
feature off is deleting four wrapper components.

It is wired on the four detail routes: each awaits one `createInternalLinker({ collection, id })` and
threads it down to every rich text block on the page, so they share one budget and the page cannot
link to itself. With no database configured it yields an empty linker and every page renders
byte-for-byte as it did before. Migration `20261119_180000_internal_link_keywords` adds the panel to
Destinations and Pages and copies existing SEO keywords into it for Trips and Blog, so no trip's or
post's links go dark on deploy. Destinations and Pages start empty — fill their panels to link to
them. Full design, rules, limitations and the verify-after-deploy `curl`:
**[docs/content/internal-linking.md](docs/content/internal-linking.md)**. `npm test` covers the engine and the
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

### Reviews and ratings

This project does not use customer reviews, testimonials, star ratings, or review counts, and emits
no `Review` / `AggregateRating` structured data. Link cards still support imagery, text, links, and
prices. Trip difficulty levels are not customer ratings and remain available.

Migration `20261120_185728_remove_reviews` intentionally deletes legacy testimonial and rating data
from published content, drafts, and version history. **Back up the database before deployment**;
rollback restores the schema, not deleted content. See [the migration notes](docs/content/page-sections.md#reviews-and-ratings-are-not-supported).

### Open Graph and structured data

Every page builds its metadata with `buildMetadata()` — canonical, `og:*`, `twitter:*`, robots — and
renders JSON-LD from the builders in `src/lib/seo.ts`. Images always go through `imageUrl()` /
`schemaImageUrl()`, which turn a Media document into an **absolute** URL: schema.org drops relative
ones.

| Page | Open Graph | JSON-LD |
| ---- | ---------- | ------- |
| `/` | `website` + default share image | `Organization`, `WebSite` (`name`, `alternateName`, `url`), `FAQPage` when the block is used |
| `/trips`, `/blog`, `/destinations` | `website` | `BreadcrumbList` + `CollectionPage` whose `ItemList` is the cards the page renders |
| `/trips/[slug]` | `website` + trip hero | `BreadcrumbList`, `TouristTrip` (itinerary, duration, keywords; describing page identifies the affiliate publisher), `FAQPage` |
| `/blog/[slug]` | `article` + `article:published_time` / `modified_time` / `tag` | `BreadcrumbList`, `BlogPosting` (author, `articleSection`, `wordCount`, keywords), `FAQPage` when the post has FAQs |
| `/destinations/[slug]` | `website` + region hero | `BreadcrumbList`, `TouristDestination` (geo, country) |
| `/inquiry` | `website` | `BreadcrumbList`, `ContactPage` |
| any CMS page (`/[slug]`) | `website` + page image | `BreadcrumbList`, `WebPage` |
| `/inquiry/thank-you`, 404 | — | — (both `noindex`, so nothing is offered to the index) |

**WebSite supports site names, not a search box.** The homepage keeps the CMS-configured `name`
and canonical site `url`, with `HikeGlobally` as its `alternateName`. `SearchAction` is no longer
emitted: Google removed the sitelinks search box on November 21, 2024. This change does not affect
on-site search or guarantee which site name Google displays.

**FAQPage is kept, but it is no longer a rich result.** Google stopped showing FAQ rich results
entirely on May 7, 2026, and removed FAQ reporting from the Rich Results Test and Search Console
later that summer. The `FAQPage` JSON-LD above is still emitted on `/`, `/trips/[slug]` and
`/blog/[slug]` because Google still parses it — the Q&A markup feeds AI Overviews and LLM
answers, the same audience `/llms.txt` serves — but it produces no SERP feature, so don't budget
for it. The visible FAQ section earns its place as content (it answers real questions and keeps
people on the page); the schema is a bonus, not the point.

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

The snippet is the verbatim contents of
[`docs/reference/third-party/gtag.txt`](docs/reference/third-party/gtag.txt) (measurement ID
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

### "AdSense says ads.txt status is not found"

The file AdSense crawls is **`public/ads.txt`**. Next.js copies `public/` to the deployment root, so
that file is served at `https://<host>/ads.txt` — and at the time of writing it is served with
`200`, `Content-Type: text/plain` and the correct publisher line, on both `hikeglobally.com` and
`www.hikeglobally.com`. Nothing needs to be done at the CDN; verify it directly:

```bash
curl -sSL https://hikeglobally.com/ads.txt      # google.com, pub-2988608851561676, DIRECT, f08c47fec0942fa0
```

What went wrong before, and what not to do again:

- **A repo-root `ads.txt` is never served.** Only `public/` is deployed. The root file that used to
  exist was not a manifest at all — it was the AdSense **`<script>` loader** (HTML, with Windows line
  endings). It has been deleted: the loader now lives only inline in the root layout, and
  `public/ads.txt` is the only `ads.txt` in the repository. Anyone "fixing ads.txt" from the repo
  root would otherwise have pasted HTML into a text manifest. `src/lib/ads-txt.test.ts` fails if a
  root `ads.txt` reappears.
- **The manifest and the loader must name the same publisher.** `public/ads.txt` says
  `pub-2988608851561676`; the loader in the root layout says `ca-pub-2988608851561676`. A mismatch is
  reported as *ads.txt unauthorized*, not *not found*.
- **Keep the file parser-clean.** UTF-8 without a BOM, LF line endings, one record per line, a
  trailing newline, no HTML. The test above enforces each of these.
- **Give the crawler time.** AdSense re-crawls on its own schedule; the dashboard can take a day or
  two to change after a deploy. Re-checking the URL in a browser does not trigger a recrawl, and the
  status only refreshes once the site is approved and serving ads.

If `curl` returns a challenge page or something other than `200`, the cause is in front of the app —
the Cloudflare and Vercel Deployment Protection items in the section above block the ads.txt crawler
exactly as they block the tag checker and Googlebot.

## Affiliate tag (Travelpayouts)

The Travelpayouts tag sits in the same `<head>` block, immediately after the Google AdSense
snippet. It is the verbatim contents of
[`docs/reference/third-party/travelpayouts.txt`](docs/reference/third-party/travelpayouts.txt): an
inline loader that appends `https://tpembars.com/NDgxMjc5.js?t=481279` to `document.head` at
runtime. Keep the two in sync, or change both together.

`nowprocket` and the other `data-cfasync` / `data-wpfc-render` / `seraph-accel-crit` attributes are
WordPress, Cloudflare and server-cache hints. They are carried over unchanged so the markup matches
the file you were given, and they are inert in Next.js — the only part that has to work is the small
inline loader and the `src` it injects.

## Deployment

Vercel + hosted Postgres + Vercel Blob for media (without a Blob store the deployment falls back to
Postgres storage — see [Media storage](#media-storage)). `package.json` pins `engines.node` to
`24.x` and `.nvmrc` says `24`: an open-ended range lets Vercel ignore the project's own Node setting
and build on the newest major (26.x at the time of writing), which is a build nothing here has been
tested against. A Blob store named after the project arrives as `HikeGlobally_READ_WRITE_TOKEN`;
that is reported at startup rather than silently used, because switching storage would strand the
files already in Postgres (see [Media storage](#media-storage) for the two-line fix). See
[§9 of the implementation plan](docs/architecture/implementation-plan.md#9-deployment); the short version is
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
this repo. Exactly two addresses deploy, both verified on `Hike-Globally`:

| Address | Use |
| --- | --- |
| `337236695+Hike-Globally@users.noreply.github.com` | **preferred** — stable even if the account's email privacy setting changes |
| `hikeglobally@gmail.com` | the account's primary address; also deploys |

```bash
npm run setup:git     # sets the identity and installs the pre-push hook
```

`npm run setup:git` is also wired into `prepare`, so a fresh `npm install` on a clone configures the
correct identity automatically.

#### Why an allowlist, not a blocklist

`scripts/commit-identity.mjs` is the single source of truth, and it **allows** the addresses above
rather than blocking known-bad ones. The earlier guard was a blocklist (`@arena.ai`, `@local`, …),
which is why this kept recurring: any *new* agent or tool address was not on the list, passed the
check, was pushed, and blocked the deploy. With an allowlist, an unrecognised address fails instead
of slipping through.

Two details it gets right, both real Vercel behaviour:

- **Plus-addressing is not normalised.** `hikeglobally+ci@gmail.com` is a *different* identity to
  Vercel and does not deploy, so the allowlist compares exact strings.
- **`noreply@github.com` is committer-only.** GitHub Web-flow is the committer on merge commits it
  creates; it is never a valid author.

The earlier failure text was:

> The deployment was blocked because the commit email `agent@arena.ai` could not be matched to a
> GitHub account. Ensure your git email matches your GitHub account.

`git log -1 --pretty='%an <%ae>'` shows the identity of the commit you are about to push —
rewriting the author of an already-pushed commit requires a force-push and a new PR.

#### The guard runs automatically in CI

`scripts/check-commit-author.mjs` encodes the rule, and
[`verify-commit-author`](.github/workflows/verify-commit-author.yml) runs it on every pull request
and every push to `main`. It is a required check: a red X on that job means Vercel will refuse to
deploy the commit, and the job summary names the offending author and prints the fix.

The workflow checks the **PR head sha**, not the synthetic merge commit, because Vercel builds the
head — so the check fails exactly where Vercel would, and nowhere else. It needs no `npm ci`: the
guard is dependency-free, so the job finishes in seconds and cannot be broken by a failing install.

Run it locally before pushing if you want the answer sooner:

```bash
npm run verify:commit-author                     # the commit Vercel would build (HEAD)
npm run verify:commit-author origin/main..HEAD   # every commit on the branch
npm run verify:commit-author <sha>               # one specific commit
```

It exits non-zero and prints the exact `git config` fix when it finds an author address Vercel
cannot verify, instead of leaving a blocked deployment behind.

`npm run setup:git` installs the same guard as a repo-local `pre-push` hook, so a bad commit is
refused before it reaches GitHub. It never overwrites a custom `pre-push` hook you wrote.

Pass `HEAD` explicitly in that hook — a `pre-push` hook receives `<remote> <url>` as `$1`/`$2`, so
forwarding `$1` would hand the guard the remote name and check the wrong commit.

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
