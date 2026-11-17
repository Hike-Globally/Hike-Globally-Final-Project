# How a brand search result is put together

The reference screenshot (`Google Reference.png`) shows a generic brand result:

```
[favicon]  altipro-adventures.com                                 ⋮
Altipro Adventures | Leading Expedition Company in Nepal …        (blue title)
grey description …
──────────────────────────────────────────────────────────────
Our Team          ›
Expeditions       ›
Who We Are        ›
Mera Peak Expedition ›
Trekking in Nepal ›
More results from altipro-adventures.com »
```

This note maps each of those parts to what Hike Globally can and cannot control, and to where the
code for it lives. It is about **appearance**, not ranking.

## 1. What is in the result, and who decides

| Element in the screenshot | Who decides | Where it comes from for this site |
| --- | --- | --- |
| Favicon (left of the domain) | Google, from the homepage icon | `src/lib/favicon.ts` — `/favicon.svg` (browsers), `/favicon.ico` (16/32/48), `/apple-touch-icon.png` (iOS) and `/icon-192.png` (Google: square, a multiple of 48px). Generated from `public/images/logo.svg`. |
| Domain line | Google | The canonical origin, `NEXT_PUBLIC_SITE_URL`. |
| Site name (bold above the title, on mobile) | Google, influenced by markup | `WebSite` on the homepage (`name`, `url`, `alternateName`) **plus** `og:site_name`, the homepage `<title>` and the homepage headings — all four carry `settings.siteName` unchanged. |
| Blue title link | Google, rewritten from `<title>`, `<h1>` and anchor text | `buildMetadata()` per page; the homepage uses `H1`-backed, brand-first wording. |
| Grey description | Google, from the meta description or the page body | `settings.tagline` / each page's SEO panel. |
| The indented links ("Our Team", "Expeditions" …) | **Google, algorithmically** | No markup exists for these. Candidates come from internal prominence: the header nav, the footer, and how many other pages link to them with descriptive anchors. |
| "More results from …" | Google | Generated from the same sitelink model. |
| ⋮ menu (share / remove) | Google, user-side | Not indexable — it is a personal control, not a feature to earn. |

**There is no sitelink schema, meta tag, Search Console form or API.** Google's own documentation
has said for years that sitelinks are automated, and the old Search Console "demote sitelink" tool
was removed in 2016. Anything that offers to "add sitelinks" in markup is selling nothing.

## 2. What actually decides whether a brand result gets sitelinks

1. **A recognisable brand query.** Sitelinks appear mostly for navigational searches ("hike
   globally", "hike globally trips"). Google must be confident which entity the query means.
2. **One unambiguous name.** A distinctive brand that does not collide with a bigger same-named
   site. This is why the name is spelled identically in `WebSite`, `Organization`, `og:site_name`,
   the `<title>` and the footer — mixed variants ("Hike Globally", "HikeGlobally", "Hike Globally
   Trekking Pvt. Ltd.") read as three signals.
3. **A shallow hierarchy with distinctive titles.** `/trips`, `/destinations`, `/blog`, `/about`,
   `/contact` are exactly the shape of the candidate pool; a page's `<title>` is usually the label
   Google shows.
4. **Internal links from many templates.** A page linked only from the footer is a weaker
   candidate than one linked from the header, the homepage sections *and* body copy.
5. **Enough crawl history.** Sitelinks are recalculated as Google re-crawls; they can take weeks to
   appear or change after a structural change.

## 3. What the markup can do — and what it cannot

What markup *does* buy (all in `src/lib/seo.ts`):

- `WebSite` on the homepage — the one documented way to state a **site-name preference**
  (`name` + `url`, with `alternateName` as the documented fallback, e.g. the bare domain).
- `Organization` on the homepage — the brand entity: `name` (the short brand), `legalName` (the
  registered company), `logo`, `address`, `contactPoint`, `sameAs` profile links. This is what a
  Knowledge Panel is assembled from; the logo must be at least 112×112.
- `BreadcrumbList` on every page — can replace the raw URL in a result with a readable path
  (`hikeglobally.com › Trips › Everest Base Camp`), and is separate from the indented sitelinks.
- `TouristTrip`, `TouristDestination`, `BlogPosting`, `CollectionPage` — describe the page itself,
  which is what makes a *non-brand* result a rich result.

What it does **not** buy, and was removed from this codebase:

- `potentialAction` / `SearchAction` — powered the sitelinks search box, which Google retired on
  **21 November 2024**. The markup is inert. (The template it carried here, `/trips?q=…`, was wrong
  anyway: the explorer filters on `?difficulty=`, `?destination=`, `?season=` and `?type=`.)
- `FAQPage` — FAQ rich results were narrowed to well-known government and health sites in August
  2023 and removed entirely in 2026. The FAQ accordion stays on the page because readers and AI
  answers read it; the markup no longer produces anything in Google.

`npm test` enforces both removals (`src/lib/seo.test.ts`, `src/lib/structured-data.test.ts`), so they
cannot quietly come back with a copy-pasted snippet.

## 4. Checking a live deployment

1. **Markup** — paste the homepage URL into the
   [Schema Markup Validator](https://validator.schema.org/) and the
   [Rich Results Test](https://search.google.com/test/rich-results). Expect `Organization`,
   `WebSite`, `BreadcrumbList` (on inner pages), and no `FAQPage` or `SearchAction`.
2. **Site name** — site names update when Google next crawls and reprocesses the homepage; request
   indexing in Search Console (`URL Inspection → Request indexing`) after a deploy.
3. **Sitelinks** — nothing to submit. Watch the brand query over several weeks; if unwanted pages
   appear, the practical levers are reducing internal links to them or removing them from
   navigation. `noindex` also removes them from sitelinks, but removes them from Search entirely.
4. **Favicon** — must be square and a multiple of 48px (or a valid SVG), and both the file and the
   homepage must be crawlable (`robots.ts` allows `/images/`, `/favicon.*` and `/icon-*.png`).
