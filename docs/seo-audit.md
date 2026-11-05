# SEO audit, Hike Globally

Branch: `arena/bf0a5f05-hike-globally-final-project`
Base commit: `62fce94`
Date: 2026-11-05

Method: static inspection of every route, layout, metadata helper, CMS field, config file and
`public/` asset in the repository. Two Next.js behaviours were confirmed against a throwaway
Next 16.3.8 app built from the same version pinned in `package.json` (canonical fallback and 404
handling), because both depend on framework internals rather than project code.

No files were changed to produce this audit. Nothing below has been implemented yet.

---

## 1. How pages are generated

| Route | Rendering | Source |
| --- | --- | --- |
| `/` | ISR, `revalidate = 3600`, CMS blocks with a fallback composition | `src/app/(frontend)/page.tsx:12` |
| `/trips` | ISR 3600, filtering happens in the browser | `src/app/(frontend)/trips/page.tsx:16`, `src/components/views/trips-explorer.tsx:50` |
| `/trips/[slug]` | ISR 3600 + `generateStaticParams`, new slugs render on demand | `src/app/(frontend)/trips/[slug]/page.tsx:10`, `:17` |
| `/destinations` | ISR 3600 | `src/app/(frontend)/destinations/page.tsx:18` |
| `/destinations/[slug]` | ISR 3600 + `generateStaticParams` | `src/app/(frontend)/destinations/[slug]/page.tsx:11` |
| `/blog` | ISR 3600 | `src/app/(frontend)/blog/page.tsx:16` |
| `/blog/[slug]` | ISR 3600 + `generateStaticParams` | `src/app/(frontend)/blog/[slug]/page.tsx:11` |
| `/inquiry` | ISR 3600, form posts to Formsubmit | `src/app/(frontend)/inquiry/page.tsx:13` |
| `/inquiry/thank-you` | Static, `noindex` | `src/app/(frontend)/inquiry/thank-you/page.tsx:10` |
| `/[slug]` | ISR 3600 + `generateStaticParams`, any CMS page | `src/app/(frontend)/[slug]/page.tsx:12`, `:19` |
| `/admin`, `/api/*` | Payload admin and REST/GraphQL, `noindex, nofollow` | `src/app/(payload)/layout.tsx:26`, `src/payload.config.ts:87` |
| `/robots.txt` | Metadata route | `src/app/robots.ts` |
| `/sitemap.xml` | Metadata route, `revalidate = 3600`, purged on publish | `src/app/sitemap.ts:20`, `src/hooks/revalidate.ts:113` |

Pagination: none exists. Listings filter client side and write only `?difficulty=` to the URL.
Search: no site search route exists.

---

## 2. Verified working, untouched

| Feature | Evidence | Status |
| --- | --- | --- |
| `robots.txt` exists, allows CSS/JS, references the sitemap, sets host | `src/app/robots.ts:5-16` | Exists, untouched (one conflict in section 3) |
| No stray `public/robots.txt` or second sitemap generator | `public/` listing, `src/app/` contains only `robots.ts` and `sitemap.ts` | Exists, untouched |
| XML sitemap covers homepage, 3 listings, `/inquiry` and every published document, one URL each, real `lastmod`, `noIndex` skipped, reserved slugs skipped | `src/lib/sitemap.ts:74-202` | Exists, untouched |
| Canonical on every page, built by one helper shared with `og:url`, sitemap and JSON-LD | `src/lib/seo.ts:62-95`, `src/lib/seo.ts` `buildMetadata`, `src/lib/canonical-coverage.test.ts` | Exists, untouched |
| Trailing slash and query normalisation, no duplicate canonical tag | `src/lib/seo.ts:46-95`, verified that a page level `alternates` replaces the layout block | Exists, untouched |
| Site wide canonical fallback for routes that forget metadata | `src/app/(frontend)/layout.tsx:102-117`; verified in Next 16.3.8 that a `URL` instance is used as a base and resolved against the request pathname | Exists, untouched |
| Legacy `/en`, `/de`, `/fr` redirects (308) | `next.config.mjs:57-72`, `src/middleware.ts:12-21` | Exists, untouched |
| `noindex` on thank you and admin | `src/app/(frontend)/inquiry/thank-you/page.tsx:16`, `src/app/(payload)/layout.tsx:29` | Exists, untouched |
| 404 page for unknown single segment URLs, true 404 status, no canonical, `noindex`, helpful links | `src/app/(frontend)/not-found.tsx:16-43` | Exists, untouched (scope gap in section 3) |
| Unique title and description per page via one builder, description truncated to 160 | `src/lib/seo.ts` `buildMetadata`, one call site per route | Exists, untouched |
| Open Graph and Twitter card blocks, 1200x630 defaults, `article` type plus `publishedTime`, `modifiedTime`, `article:tag` for posts | `src/lib/seo.ts`, `src/app/(frontend)/layout.tsx:83-96` | Exists, untouched |
| `<html lang>`, viewport, color scheme, theme color, format detection | `src/app/(frontend)/layout.tsx:121-135`, `src/i18n/config.ts:41` | Exists, untouched (duplicate tag in section 3) |
| JSON-LD: `Organization` + `TouristInformationCenter`, `WebSite`, `BreadcrumbList` on every inner page, `BlogPosting` with author and dates, `TouristTrip` with offer and itinerary, `TouristDestination`, `CollectionPage` with `ItemList`, `ContactPage`, `WebPage`, `FAQPage` only where FAQs render | `src/lib/seo.ts:326-590`, `src/app/(frontend)/page.tsx:70-87`, `src/components/views/*-detail.tsx` | Exists, untouched (one invalid node in section 3) |
| No invented ratings, reviews or prices; `Offer` uses required CMS fields | `src/collections/Trips.ts:235-247`, no `AggregateRating` anywhere | Exists, untouched |
| Breadcrumb trail UI on every listing and detail page, descriptive anchors, related content blocks | `src/components/sections/breadcrumbs.tsx`, `src/components/views/*-detail.tsx` | Exists, untouched |
| Image alt text enforced in the CMS, width and height emitted, lazy by default with `priority` for heroes | `src/collections/Media.ts:78-86`, `src/components/ui/payload-image.tsx:80-91` | Exists, untouched |
| Slugs auto-formatted to lowercase, hyphenated, diacritic free, and stable after publish | `src/fields/slug.ts:10-44` | Exists, untouched |
| Analytics: GA4 tag plus Vercel Analytics | `src/app/(frontend)/layout.tsx:140-161`, `:182` | Exists, untouched |
| Fonts self hosted, preloaded, `display: swap` | `src/app/(frontend)/layout.tsx:30-55` | Exists, untouched |
| `poweredByHeader: false`, media route sets its own cache and CSP headers | `next.config.mjs:15`, `src/storage/database-adapter.ts:223-232` | Exists, untouched |

---

## 3. Gaps to fix (awaiting approval)

Each item is ordered by likely search impact. Every proposed edit is the smallest change that
closes the gap.

### G1. `robots.txt` blocks the uploaded images that the site itself serves

Evidence:

- `src/app/robots.ts:11` disallows `/api/`.
- When media is stored in Postgres (a supported mode), every image and video URL is
  `/api/media/file/<filename>`: `src/storage/database-adapter.ts:106-108`, described at
  `src/storage/database-adapter.ts:13-15`. Tests assert that shape, for example
  `src/lib/seo.test.ts:247-267`.
- Those URLs are public (`access.read: anyone`, `src/collections/Media.ts:21`), they are the `src`
  of every CMS image and the `image` of every `BlogPosting`, `TouristTrip` and `TouristDestination`
  node.

Impact: in that storage mode Googlebot cannot fetch any CMS image, which removes image search
traffic and weakens image rich results. It also blocks the media that structured data points at.

Smallest fix: add an explicit allow for the public media path, keeping the API blocked.

```ts
allow: ['/', '/api/media/file/'],
disallow: ['/admin', '/api/', '/preview/'],
```

No other line changes. Vercel Blob and local disk deployments are unaffected (their URLs are not
under `/api/`).

### G2. The custom 404 does not cover unmatched multi segment URLs

Evidence:

- The only 404 boundary is `src/app/(frontend)/not-found.tsx`.
- There is no `src/app/global-not-found.tsx` and no `src/app/not-found.tsx` (see the `src/app`
  listing).
- The catch-all `src/app/(frontend)/[slug]/page.tsx` only matches one segment, so `/typo` renders
  the branded 404 but `/trips/old-slug/extra` or `/blog/2024/anything` match no route at all.
- Confirmed in a Next 16.3.8 build with the same route group shape: unmatched multi segment URLs
  return status 404 but render Next's built in "This page could not be found" page, with no header,
  footer or helpful links. Adding `global-not-found.tsx` produced the branded page with the correct
  404 status.

Impact: real broken inbound links (the common case for a trekking site, where old trip URLs carry
extra path segments) land on a dead end with no navigation, and the page is invisible to the site's
own design.

Smallest fix: add `src/app/global-not-found.tsx` that renders the same copy and links as the
existing 404 (`dictionary.notFound`, `src/i18n/dictionaries.ts:265`), importing `globals.css` and
the two self hosted fonts so it is styled like the site. `next build` already supports this file
convention in the pinned version, with no config change and no new dependency.

Note: this file must not set `robots` in its metadata. Next already emits `<meta name="robots"
content="noindex">` for it; adding one produced two robots tags in the probe.

### G3. `WebSite` declares a `SearchAction` for a search that does not exist

Evidence:

- `src/lib/seo.ts:378-382`: `target: ${url}/trips?q={search_term_string}`.
- No route reads a `q` parameter. `src/components/views/trips-explorer.tsx:38-56` mirrors only
  `?difficulty=`, and the file comment at `:50-54` states filtering is client side by design.
  There is no search page anywhere under `src/app/(frontend)`.

Impact: Google's structured data validation rejects a `SearchAction` whose target does not perform
the search, and the sitewide `WebSite` node is the one most likely to be read.

Smallest fix: remove the `potentialAction` block from `websiteJsonLd()` so the node describes the
site truthfully. Nothing else in the builder changes. (Alternative, if you want the feature: add a
real `?q=` filter. That is new functionality, so it needs your decision, see section 4.)

### G4. Duplicate `theme-color` meta tag on every page

Evidence:

- `src/app/(frontend)/layout.tsx:99-101` emits `other: { 'theme-color': '#183144' }`.
- `src/app/(frontend)/layout.tsx:121-127` emits `viewport.themeColor: '#183144'`.
- Confirmed in a Next 16.3.8 build: two `<meta name="theme-color" content="#183144"/>` tags per
  page.

Impact: duplicated metadata, the exact class of conflict the brief asks to fix. No visible change
either way.

Smallest fix: delete the `other` block at `:99-101` and keep the `viewport` export, which is the
supported mechanism in this Next version.

### G5. No web app manifest

Evidence: no `manifest.ts`, no `manifest.json` or `manifest.webmanifest` under `src/app` or
`public/`, and no `manifest` key in the layout metadata (`src/app/(frontend)/layout.tsx:57-119`).

Impact: missing PWA/install metadata and no `theme_color`/`icons` block for Android and Chrome.
Low ranking value, but it is on the brief's checklist and is purely additive.

Smallest fix: add `src/app/manifest.ts` using the existing brand values (`siteName`,
`tagline` from the Settings global, `#183144` theme color, `/images/logo.svg` icon). It is served at
`/manifest.webmanifest` automatically and does not touch any existing file.

### G6. Favicon set is a single SVG with no Apple touch icon

Evidence: `src/app/(frontend)/layout.tsx:97` sets `icons: { icon: '/images/logo.svg' }` only. There
is no `apple-touch-icon` and no `icon.png` in `public/`.

Impact: iOS home screen bookmarks get a screenshot instead of the logo. Cosmetic for SEO, listed
for completeness.

Smallest fix: add an `apple` entry to the existing `icons` object once a 180x180 PNG exists. That
asset has to be generated from the logo, so it is listed as a TODO in section 5 rather than
invented here.

### G7. No security headers at all

Evidence: `next.config.mjs:75-90` is the only `headers()` block and it sets `Cache-Control` on
`/images/:path*` only. Nothing sets `Strict-Transport-Security`, `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options` or `Permissions-Policy`.

Impact: not a ranking factor, but it is on the brief's checklist, and HSTS plus sniffing protection
are baseline for a site that takes payments-adjacent enquiries.

Smallest fix: add one more entry to the existing `headers()` array, scoped to `/:path*`, with:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`

`SAMEORIGIN` is safe here: live preview frames same origin pages (`src/payload.config.ts:91-100`).
A full `Content-Security-Policy` is deliberately excluded: GA4, AdSense, Pexels and Vercel Blob all
need sources, and a wrong policy would break ads and analytics. That is a separate decision, see
section 4.

### G8. Heading level skip on the two card listings

Evidence:

- `/trips`: `<h1>` at `src/app/(frontend)/trips/page.tsx:71`, then trip cards render `<h3>` at
  `src/components/cards/trip-card.tsx:69`. The results section is labelled with `aria-label`, not a
  heading (`src/app/(frontend)/trips/page.tsx:93-98`).
- `/blog`: `<h1>` at `src/app/(frontend)/blog/page.tsx:81`, post cards render `<h3>` at
  `src/components/cards/post-card.tsx:71`, section is `aria-label` only at `:105-108`.
- `/destinations` is correct: it has real `<h2>` section headings (`destinations/page.tsx:114`,
  `:148`).

Impact: h1 to h3 with nothing between is a skipped level. Screen readers lose the section
structure and the outline is less useful to search engines.

Smallest fix: add one visually hidden `<h2>` at the top of each results section, reusing strings
that already exist (`dict.trips.filterTitle`, `dict.blog.latest`). No visual change, no copy change,
no shared card component touched (cards keep `<h3>` because on the homepage they do sit under a
real `<h2>`).

### G9. `ads.txt` is not served

Evidence: `ads.txt` exists at the repository root. Next only serves files from `public/`, and
`public/` contains images only (see the `public/` listing). So `/ads.txt` currently 404s while
AdSense is loaded on every page (`src/app/(frontend)/layout.tsx:156-160`).

Impact: AdSense cannot verify the seller declaration. Not a ranking factor, but it is a broken file
that costs nothing to fix and sits next to the analytics work.

Smallest fix: add `public/ads.txt` with the same single line. Decide whether the root copy stays as
the source of truth or is removed, see section 4.

---

## 4. Needs my input (not changed)

1. **Canonical host: apex or www.** `.env.example:17` sets
   `NEXT_PUBLIC_SITE_URL=https://hikeglobally.com`, while `README.md` states the production host is
   `www.hikeglobally.com` and that the Vercel host 308 redirects there. Every canonical, `og:url`,
   sitemap entry and JSON-LD `url` follows `NEXT_PUBLIC_SITE_URL` (`src/lib/seo.ts:11`). If
   production actually serves `www`, all of those point at a URL that redirects. Please confirm the
   one canonical host, then either change the env value or add the missing host redirect. I did not
   touch this because it is deployment configuration, not code.
2. **Images are deliberately unoptimized.** `next.config.mjs:38` sets `images.unoptimized: true`
   and `src/components/ui/payload-image.tsx:86,133` pass `unoptimized`, with the reasoning in the
   config comment. Consequence: no `srcset`, no AVIF or WebP conversion, no responsive resizing.
   This is the largest Core Web Vitals gap on the site (every hero ships full size bytes). Changing
   it reverses a documented decision, so it needs your approval.
3. **4K autoplay hero video.** `src/components/blocks/hero-background.tsx:2-29` streams a 3840x2160
   MP4 from `videos.pexels.com` on the homepage, with a Pexels poster JPEG that is not preloaded.
   That is the biggest LCP and INP risk I found. Options: keep the design and serve a 1080p source,
   preload the poster, or set `preload="none"`. Pick one and I will make only that change.
4. **Search: remove the invalid `SearchAction` (G3) or build a real `?q=` filter.** Removing is the
   smallest honest fix. Building search is new functionality and would need its own page, metadata,
   `noindex` on the results view and a sitemap exclusion.
5. **`ads.txt`: copy to `public/` and keep the root file, or move it.** I will not delete a root file
   without your word.
6. **Full Content-Security-Policy.** Not started, because it would need an audit of GA4, AdSense,
   Pexels and blob storage sources plus a report-only rollout. Say the word if you want it planned.
7. **Rich text can emit an `<h1>`.** `src/components/content/rich-text.tsx:222-223` renders whatever
   heading tag the editor stored, and the shared editor is Payload's default feature set
   (`src/payload.config.ts:125-131`), which includes level 1. A post body that starts with an H1
   therefore gives `/blog/[slug]` two H1s on top of `src/components/views/post-detail.tsx:139`.
   Content dependent, so I left it alone. If you want it closed, the smallest fix is restricting the
   editor to h2 to h4.
8. **GA4 and AdSense load without consent.** `src/app/(frontend)/layout.tsx:140-161`. A legal and
   performance question, not an indexing one. Not changed.

---

## 5. TODOs (real data I will not invent)

| Placeholder | What is missing | Where it would be used |
| --- | --- | --- |
| Default social share image | `settings.defaultOgImage` is an optional upload (`src/globals/Settings.ts:40-46`). If it is empty, pages with no hero image produce no `og:image` and no `twitter:image`. There is also no static 1200x630 file in `public/` to use as a last resort. TODO: add one real 1200x630 asset, then either upload it to Settings or point the layout fallback at it. | `src/app/(frontend)/layout.tsx:65,89,95` |
| Apple touch icon | A 180x180 PNG generated from `public/images/logo.svg`. TODO: asset. | `src/app/(frontend)/layout.tsx:97` |
| Manifest icons | 192x192 and 512x512 PNG icons for `src/app/manifest.ts`. TODO: assets. | new `src/app/manifest.ts` (G5) |
| Organization details | Legal name, postal address, phone and social profiles come from Settings (`src/globals/Settings.ts`). Where they are blank, `organizationJsonLd()` correctly omits them, so the Knowledge Panel data is incomplete until they are filled in. TODO: confirm the real values with the business. | `src/app/(frontend)/page.tsx:72-84` |

---

## 6. Cannot be verified from this repository

These need the deployed site or a database, so I am not guessing at them:

- Thin pages, duplicate titles, duplicate content, keyword cannibalization and orphan pages. All of
  that lives in CMS documents, and the sandbox has no database. The code paths that would expose it
  are correct, but the content judgement needs a crawl of production.
- Broken internal and external links, and redirect chains. The only hardcoded internal URLs are the
  bundled `/images/...` paths, and every one of them resolves to a real file. Everything else is
  built from CMS slugs.
- Whether Googlebot is actually reaching Next.js. `README.md` documents the two ways this fails in
  front of the app (Cloudflare bot protection, Vercel deployment protection). Worth confirming with
  a live `curl` before any of the fixes above are judged by Search Console.
- Real Core Web Vitals field data. Section 4 items 2 and 3 are the structural risks; the numbers
  need CrUX or Search Console.

---

## 7. Implementation log (approved on 2026-11-05)

All nine gaps were approved, plus real search instead of removing the `SearchAction`, plus
re-enabling Next image optimization. The canonical host was confirmed as the apex
(`https://hikeglobally.com`), so no URL or redirect change was needed.

Every change below was verified on a production build (`npm run build`), with `npm test` (173 tests
passing), `npx eslint .` and `npx tsc --noEmit` clean, and by curling the running build.

| # | Change | Files | Verified |
| --- | --- | --- | --- |
| G1 | Uploads stay crawlable | `src/app/robots.ts` | `/robots.txt` now returns `Allow: /` plus `Allow: /api/media/file/`, `Disallow: /api/` still in place |
| G2 | Branded 404 for URLs that match no route | new `src/app/global-not-found.tsx`, new `src/components/views/not-found-content.tsx`, `src/app/(frontend)/not-found.tsx` | `/a/b/c` returns 404 with the site header, footer, stylesheet and "Browse trips" link instead of Next's bare page |
| G3 | Search that actually searches | new `src/app/(frontend)/search/page.tsx`, `src/lib/seo.ts`, `src/lib/site-routes.ts`, `src/i18n/dictionaries.ts`, `src/lib/structured-data.test.ts` | `/search?q=everest` returns 200 with real trip and destination results; the homepage `SearchAction` target is `/search?q={search_term_string}`; `/search` is absent from `/sitemap.xml` and is `noindex, follow` |
| G4 | One `theme-color` tag | `src/app/(frontend)/layout.tsx` | rendered homepage now contains exactly one |
| G5 | Web app manifest | new `src/app/manifest.ts`, new `public/icons/icon-192.png`, `public/icons/icon-512.png` | `/manifest.webmanifest` serves valid JSON and every page links it |
| G6 | Apple touch icon | new `public/apple-touch-icon.png`, `src/app/(frontend)/layout.tsx` | `/apple-touch-icon.png` returns 200 `image/png` and every page links it |
| G7 | Security headers | `next.config.mjs` | HSTS, `nosniff`, `Referrer-Policy` and `X-Frame-Options: SAMEORIGIN` present on every response |
| G8 | Heading hierarchy on the card listings | `src/app/(frontend)/trips/page.tsx`, `src/app/(frontend)/blog/page.tsx` | rendered order is now h1, h2, then the cards' h3 |
| G9 | `ads.txt` served | new `public/ads.txt` | `/ads.txt` returns 200. The root `ads.txt` file holds an AdSense script snippet, not an ads.txt record, so the served file carries the standard authorized-seller line for publisher `pub-2988608851561676` (see the note below) |
| E | Next image optimization | `next.config.mjs`, `src/components/ui/payload-image.tsx`, `src/lib/media-quality.test.ts` | every image now renders a `srcSet`; `/_next/image?url=...` returns optimized bytes. `src` is still the original upload, never a Payload crop |

Two extra findings from verifying the fixes:

- The 404 declares `robots: { index: false, follow: true }` while Next also emits its own `noindex`
  for a not-found document, so a 404 carries the directive twice. Left as is on purpose: the two
  tags agree, and the explicit one is what `src/lib/canonical-coverage.test.ts` guards. Removing it
  would have meant weakening that test to save one redundant tag.
- The font definitions are now shared between the site layout and the new global 404 through
  `src/lib/fonts.ts`, so the new page did not duplicate the font setup.

Still open, by your decision or because they need data:

1. `public/ads.txt` carries `pub-2988608851561676`, the publisher ID already used by the AdSense
   tag in `src/app/(frontend)/layout.tsx`. Please confirm it against your AdSense account before
   launch, and decide whether the misnamed `ads.txt` at the repository root should be deleted.
2. The 4K Pexels hero video, the missing default social share image, the CSP and the rich-text
   `<h1>` risk (sections 4 and 5) are unchanged.
3. Content-level checks (thin pages, cannibalization, orphan pages, broken inbound links) still
   need a crawl of the deployed site with the database attached.
