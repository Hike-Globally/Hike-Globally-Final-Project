# Documentation

Reference material for **Hike Globally** — Next.js 16 App Router + Payload CMS 3 + PostgreSQL.
Start with the root [README](../README.md) for setup, environment variables and deployment; the
documents here go deeper on specific areas.

| Folder | What lives there |
| ------ | ---------------- |
| [`architecture/`](architecture/) | How the application is put together — stack, data model, routing, caching, performance, deployment. |
| [`content/`](content/) | Editor-facing features: page sections, internal linking, trip brochure, trip audience. |
| [`design/`](design/) | Visual standards: the admin design system and the large-screen responsive layout. |
| [`reference/`](reference/) | Operational runbooks and the verbatim third-party snippets kept in source control. |
| [`assets/`](assets/) | Design source files and screenshots referenced by the documents and by code comments. |

## Architecture

| Document | Description |
| -------- | ----------- |
| [implementation-plan.md](architecture/implementation-plan.md) | Full architecture, content model, routing, caching & revalidation strategy, performance decisions and trade-offs. |

## Content features

| Document | Description |
| -------- | ----------- |
| [page-sections.md](content/page-sections.md) | Per-page section ordering, custom HTML sections and link previews on trips and blog posts. |
| [multi-url-preview.md](content/multi-url-preview.md) | Multi-URL Preview page sections and inline content blocks: layouts, animations, accessibility and deployment. |
| [internal-linking.md](content/internal-linking.md) | Automatic internal links from keywords — how editors use it and how the engine works. |
| [trip-brochure.md](content/trip-brochure.md) | The downloadable trip brochure on the trip page. |
| [trip-audience.md](content/trip-audience.md) | The *Who Is This Trip For / Not For* cards on the trip page. |
| [author-expertise.md](content/author-expertise.md) | Public author qualifications, trip itinerary experts, and site-wide publisher identity. |

## Design

| Document | Description |
| -------- | ----------- |
| [design-system.md](design/design-system.md) | The admin design system: tokens in `admin-theme.css`, typography, spacing, component standards. |
| [responsive-layout.md](design/responsive-layout.md) | How the frontend scales from laptop to 4K / TV widths, and the verification matrix. |

## Reference

| Document | Description |
| -------- | ----------- |
| [media-blob-migration.md](reference/media-blob-migration.md) | Manual production runbook for copying Postgres media into a Vercel Blob store. |
| [third-party/gtag.txt](reference/third-party/gtag.txt) | The verbatim GA4 / AdSense snippet pasted into the root layout. |
| [third-party/travelpayouts.txt](reference/third-party/travelpayouts.txt) | The verbatim Travelpayouts affiliate snippet pasted into the root layout. |

## Assets

Images and source files referenced by the documents above and by code comments. Nothing in this
folder is served by the site — runtime assets live in `public/`, and CMS uploads live in
`public/media/` (or Blob / Postgres, depending on the media storage mode).

| Asset | Referenced from |
| ----- | --------------- |
| [logo.svg](assets/logo.svg) | Brand / logo source file. |
| [footer-sample.png](assets/footer-sample.png) | `src/components/layout/footer.tsx` — the design the footer was ported from. |
| [key-takeaway.png](assets/key-takeaway.png) | The key-takeaways section design. |
| [publish-button-before-after.png](assets/publish-button-before-after.png) | [design-system.md](design/design-system.md) — the Publish button redesign. |
| [rope-carousel-reference.html](assets/rope-carousel-reference.html) | `src/components/cards/rope-carousel.*` — the original carousel saved from the web. |
| [media-migration-windows.zip](assets/media-migration-windows.zip) | Bundled copy of `scripts/migrate-media-to-blob.mjs` for running the migration from Windows. |
