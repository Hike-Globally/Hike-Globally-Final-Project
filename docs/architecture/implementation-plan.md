# Hike Globally — implementation plan & architecture

A travel site for a Himalayan trekking operator. One Next.js App Router
application serves both the public website and the CMS: Payload 3 is embedded in the same app,
so there is no separate API server to deploy, and content saved in the CMS appears on the site
without a rebuild.

Status: **built and running.** Every section below describes what exists in this repository.

---

## 1. Stack

| Concern   | Choice                                                                                        | Why                                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.3 (App Router, React 19)                                                           | Server components by default → almost no client JS; file-based routing and static prerendering of every public page. |
| CMS       | Payload CMS 3.90, embedded via `@payloadcms/next`                                             | One deployable, one database connection pool, admin at `/admin`, REST + GraphQL for free.                            |
| Database  | PostgreSQL (`@payloadcms/db-postgres` + Drizzle)                                              | Required by the brief; JSON + relational queries, real migrations.                                                   |
| Styling   | Tailwind CSS v4 (`@theme` tokens) + shadcn/ui primitives                                      | Tokens define the palette once; primitives are extended, never replaced.                                             |
| Fonts     | Google Sans Flex 600 (headings), Archivo 300 (body), self-hosted via `@fontsource-variable/*` | No render-blocking request to Google Fonts, no third-party dependency at runtime.                                    |
| Motion    | Lenis (smooth scroll) + a single `Reveal` component (IntersectionObserver)                    | Scroll feel without shipping an animation library to every page.                                                     |
| Images    | `sharp` + Payload image sizes                                                                 | AVIF/WebP variants generated on upload, focal point honoured on crop.                                                |
| Forms     | Formsubmit.co POST                                                                            | Brief requirement: no Payload form collection, no backend to maintain.                                               |
| Deploy    | Vercel + hosted Postgres (Neon/Supabase/RDS) + Vercel Blob or S3 for media                    | Matches the target environment; ISR + on-demand revalidation.                                                        |

The version matrix is pinned in `package.json`; the lockfile is committed.

---

## 2. Architecture

```
src/
  app/
    (frontend)/…                 public site, no locale prefixes
    (payload)/admin/[[...segments]]  Payload admin (generated)
    api/[...slug]                Payload REST
    api/graphql                  Payload GraphQL
    api/revalidate               on-demand cache invalidation (Bearer protected)
    sitemap.ts, robots.ts, llms.txt/route.ts
  collections/                   Media, Destinations, Trips, Blog, Pages, Users
  globals/                       Header, Footer, Settings
  blocks/                        11 page blocks used by Pages
  fields/                        reusable field builders (slug, meta, link, richText)
  hooks/revalidate.ts            afterChange/afterDelete → revalidateTag + revalidatePath
  lib/data.ts                    all reads for the frontend, cached by tag
  components/                    blocks · views · layout · cards · sections · ui · forms · seo
  i18n/                          locale config (one language) + UI dictionary
middleware.ts                    legacy /en · /de · /fr redirects + Payload same-origin auth
```

**Why one app instead of two:** Payload 3 runs as a plugin-style route group inside Next.js.
That removes an entire deployment (no separate CMS host, no CORS, no duplicated auth), keeps the
editor's live preview on the same origin as the site, and lets the frontend read Payload's local
API (no HTTP round-trip, fully typed).

---

## 3. Content model

| Collection     | Purpose                                            | Notable fields                                                                                                                                                                      |
| -------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `media`        | Images with optimized sizes, alt text, focal point | `alt` (required, localized), `focalX/focalY`, sizes `thumbnail · card · tablet · hero · og`                                                                                         |
| `destinations` | Regions (Khumbu, Annapurna, Langtang, Mustang)     | `heroImage`, `gallery`, `region`, `bestSeasons`, `coordinates`, `description`, `gettingThere`                                                                                       |
| `trips`        | Trekking packages                                  | `durationDays/Nights`, `groupSizeMax`, `maxAltitude`, `difficulty`, `priceFrom`, `highlights`, `itinerary` (day-by-day), `included`/`notIncluded`, `faqs`, `gallery`, `bookingLink` |
| `blog`         | Journal                                            | `featuredImage`, `author`, `categories`, `publishedAt`, `content`, `faqs` (same categories as trips), `relatedPosts`                                                                |
| `pages`        | Flexible pages                                     | `blocks` (localized) — hero, richText, featuredTrips, featuredDestinations, latestPosts, stats, gallery, faq, inquiry, cta                                            |
| `users`        | Admin + editors                                    | role-based access (`admin`, `editor`)                                                                                                                                               |

Globals: `header` (announcement, nav items, actions), `footer` (introduction, link columns,
legal links, copyright), `settings` (site name, contact, socials, Formsubmit address, default OG
image).

Every public collection has:

- **Versions + drafts** (`versions: { drafts: { autosave: true } }`) — editors work on a draft,
  publish when ready; the frontend only ever reads `_status: published` for anonymous visitors.
- **Access control** — `publishedOrSignedIn` for reads (drafts are invisible to the public) and
  `adminOrEditor` for writes.
- **Localized slugs** and **SEO meta** (title, description, OG image, `noIndex`).

### Language rules that matter

Payload and the public frontend use **English**. The public site uses unprefixed URLs and does not
generate locale-specific hreflang pages.

- `src/i18n/config.ts` configures Payload's single locale and keeps shared route constants.
- `blocks`, and every array of translatable items (itinerary, FAQs, highlights, stats, nav items),
  retain their existing localized storage shape.

UI chrome (buttons, empty states, filter labels) lives in `src/i18n/dictionaries.ts` instead of
the CMS. Trade-off: changing "Read more" needs a deploy, but rendering a page costs zero extra
queries and a missing key is a _build_ error.
---

## 4. Routing

| Route                                   | Rendering                          | Content source                           |
| --------------------------------------- | ---------------------------------- | ---------------------------------------- |
| `/`                                     | SSG + ISR (1 h)                    | the Page whose slug is `home` (reserved) |
| `/[slug]`                               | SSG + ISR                          | any other Page (about, privacy, …)       |
| `/trips`                                | SSG + ISR + client-side filters    | Trips collection                         |
| `/trips/[slug]`                         | SSG + ISR (`generateStaticParams`) | one Trip                                 |
| `/destinations`, `/destinations/[slug]` | SSG + ISR                          | Destinations                             |
| `/blog`, `/blog/[slug]`                 | SSG + ISR                          | Blog                                     |
| `/inquiry`, `/inquiry/thank-you`        | SSG                                | static + form                            |
| `/admin/*`, `/api/*`                    | dynamic                            | Payload                                  |

`middleware.ts` keeps the old language URLs alive: `/en/...`, `/de/...` and `/fr/...` are
308-redirected to the same page without the prefix (`/de/trips` → `/trips`), so existing links,
bookmarks and search results keep working. It also normalises Payload's same-origin
authentication headers for `/admin` and `/api` (see the comment in the file).

---

## 5. Caching & revalidation

- Every read goes through `src/lib/data.ts`, wrapped in `unstable_cache` with a **tag** per
  document and per collection (`trip(slug)`, `trips`, `destination(slug)`, `posts`, `pages`,
  `header`, `footer`, `settings`).
- Pages are statically generated with `revalidate = 3600` as a safety net.
- On save/delete, `src/hooks/revalidate.ts` invalidates the affected tags _and_ paths — the
  collection listing, the document itself, and the previous slug when a URL is renamed — so an
  old URL never keeps serving stale HTML.
- `POST /api/revalidate` accepts `{ "tags": [], "paths": [] }` with
  `Authorization: Bearer $REVALIDATE_SECRET` for external triggers (CI, a deploy hook, or a
  webhook from another system).

Trade-off: tags are invalidated per document rather than per page, which means saving a trip also
purges the listing pages it appears on. That is deliberately coarse — a stale "from $1,850" price
is worse than one extra regeneration.

---

## 6. Design system

- **Palette** — the eight supplied hex values are `#f5f0ea`, `#210516`, `#5e7993`, `#78510f`,
  `#bcb0b1`, `#cbaf35`, `#0393cd`, and `#f53f1d`; `#f5f0ea` is the requested site background.
  Token names and roles in the implementation are inferred, not user-confirmed. They are exposed as
  Tailwind v4 tokens (`bg-ink`, `text-slate`, `bg-sage-20`, …) plus semantic aliases (`card`, `border`, `ring`).
- **Type** — headings Google Sans Flex 600, body Archivo 300; a fluid scale and utility classes
  (`heading-xl`, `lead`, `eyebrow`, `.prose-hg` for rich text).
- **shadcn/ui** — Button, Badge, Card, Input, Label, Textarea, Select, Separator, Sheet, Accordion
  and friends live in `src/components/ui/`, extended with Hike Globally variants rather than
  re-skinned from scratch.
- **Motion** — Lenis runs once in the root layout (`prefers-reduced-motion` respected);
  `Reveal` fades sections in with a small stagger; hero media uses a slow parallax only when the
  visitor has not asked for reduced motion.

---

## 7. Performance decisions

1. **Server components everywhere.** Only the mobile sheet, the trip filters and the inquiry
   form ship JS.
2. **One `<Image>` wrapper** (`PayloadImage`) that picks the smallest generated size large enough
   for the slot, always passes `sizes`, and turns Payload's absolute media URLs back into
   site-relative paths so Next's optimizer handles them in every environment.
3. **AVIF → WebP → JPEG** via `next.config.mjs` `formats` and Payload's five image sizes.
4. **Cached, tagged reads** (see §5) — a page render performs a handful of queries, not dozens.
5. **Self-hosted variable fonts** with `display: swap` and preload for the two files that matter.
6. **Structured data** (Organization, WebSite, BreadcrumbList, TouristDestination, Product/Trip,
   Article, FAQPage) rendered as JSON-LD, which costs nothing at runtime.

---

## 8. Forms

`InquiryForm` is a real `<form method="POST">` pointed at `https://formsubmit.co/<email>`, with
`_next` (a thank-you page on our own domain), `_captcha=false`, a honeypot, and `onSubmit` used
only for the pending state. It works with JavaScript disabled; the trip picker is a native
`<select>` for the same reason. The recipient address comes from the `settings` global so it can
be changed without a deploy.

---

## 9. Deployment

1. Create a hosted Postgres database and set `DATABASE_URI` (and `PAYLOAD_SECRET`) in Vercel.
2. Add a storage adapter for media (`@payloadcms/storage-vercel-blob` or `-s3`) and set its
   credentials; locally, media is written to `/public/media` — **do not rely on that on Vercel**,
   the filesystem is ephemeral.
3. Set `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_FORMSUBMIT_EMAIL`.
4. Build command: `npm ci && npm run migrate && npm run build` (migrations run in the build so a
   deploy can never ship against an outdated schema). `postinstall` regenerates Payload's
   import map.
5. First deploy only: `npm run seed` against the production database if you want the demo content.
6. Point the Payload `serverURL` (it derives from `NEXT_PUBLIC_SITE_URL`) at the canonical domain
   so OG tags, emails and the sitemap carry production URLs.

---

## 10. Build order (as delivered)

1. **Payload collections + config** — access control, versions/drafts, localization, blocks,
   reusable fields, revalidation hooks.
2. **Design system** — Tailwind tokens, fonts, shadcn/ui primitives, typography utilities.
3. **Layout + Lenis + navigation** — root layout, header/footer from globals, smooth scroll,
   mobile navigation.
4. **Listing pages** — trips (with filters), destinations, blog.
5. **Single templates** — trip detail (itinerary, inclusions, FAQ, gallery, inquiry), destination
   detail, blog post.
6. **Homepage + inquiry** — block-driven homepage, `home` page with all 11 blocks, inquiry page
   and thank-you page.

Then: seed content (4 destinations, 6 trips, 5 journal posts, 2 flexible pages, 12 images), SEO
(sitemap, robots, llms.txt, JSON-LD), and a production build.

---

## 11. Trade-off register

| Decision                               | Alternative                                 | Why this way                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Payload embedded in Next.js            | Headless CMS on its own host                | One deploy, no CORS, typed local API, live preview on the same origin. Cost: the CMS and the site scale together.                                                                          |
| Localized `blocks` field               | Shared block structure, translated children | Payload does not persist localized children of a non-localized container. Keeping the field localized means re-adding a language later needs no schema change.                             |
| Single CMS locale; frontend-only EN/DE/FR switcher | Add Payload locales and locale-prefixed routes | The switcher needs no schema/DB migration and keeps every existing URL unchanged; Payload keeps one locale and the admin shows no language selector. DE/FR copy comes from editable frontend dictionaries with English fallback. |
| UI strings in TypeScript               | UI strings in the CMS                       | Zero queries per render, compile-time completeness, no layout-breaking translations. Cost: a deploy to change a button label.                                                              |
| Tag-based invalidation + 1 h ISR       | No caching, or short ISR only               | Content changes go live in seconds; the 1 h window is only a safety net for anything a hook misses.                                                                                        |
| Formsubmit.co                          | Payload form collection                     | Brief requirement; keeps submission data out of our database and needs no email piping. Cost: submissions live with a third party.                                                         |
| Native `<select>` + native POST        | Radix Select + client fetch                 | Works without JS, zero client bundle for the form. Cost: the picker cannot be styled per-option.                                                                                           |
| Self-hosted fonts                      | Google Fonts CDN                            | The sandbox (and some regions) cannot reach the CDN; self-hosting also removes a render-blocking third-party request.                                                                      |
| Drafts with autosave                   | Publish-only                                | Editors can prepare a full page and publish it in one click; the public never sees half-finished content.                                                                                  |
| Auto-hiding header with a pointer-band reveal | Hide on scroll down, show on scroll up | The brief asks for a header that hides while scrolling and comes back when the pointer reaches the top of the screen; touch devices, which have no pointer, get the scroll-up reveal instead. Pages opt into "always visible over the hero" by marking their opening band with `data-header-hero` (see `src/components/layout/header-frame.tsx`). |

---

## 12. Local development

```bash
npm install
cp .env.example .env.local      # then set DATABASE_URI and PAYLOAD_SECRET
npm run migrate                 # apply migrations
npm run seed                    # optional demo content (12 images, 4 destinations, 6 trips, 5 posts)
npm run dev                     # http://localhost:3000 · admin at /admin
```

Useful scripts: `npm run typecheck`, `npm run lint`, `npm run generate:types` (after changing a
collection), `npm run migrate:create <name>` (after changing a collection), `npm run migrate:status`.

Logs in as seeded: `admin@hikeglobally.com` / `hike-globally-2026` (change before deploying).
