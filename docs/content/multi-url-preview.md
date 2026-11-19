# Multi-URL Preview

**Multi-URL Preview** is a collection of up to **12 independently configured link cards** on a Single Trip or Single Blog page. It is an additional feature: existing **Link preview** cards, saved page layouts, paragraphs and tables are not replaced or moved.

## Add a page section

1. Open a trip or blog post in the admin.
2. In **Page sections**, add a row and set **Section → Multi-URL Preview**.
3. Optionally enter a **Heading** and a short **Introduction**.
4. Select a **Layout** and **Animation**.
5. Under **URLs**, add a row for each link. Drag the rows into the order you want.
6. Save a draft, review the live preview at mobile/tablet/desktop sizes, then publish.

Each URL row can independently override **title, description, rating, number of reviews, price and original price**, just like Link preview. Only enter accurate ratings/prices; they are editorial values, not extracted or invented by this feature. The original price is struck through. Empty overrides are omitted or use the linked page's metadata, as appropriate.

You can add several Multi-URL Preview sections to one page and move each collection independently. Their row labels show the heading and URL count. The individual URL labels show the override title or linked address. A blank URL row is skipped publicly; a collection with no valid URLs renders **nothing**, including no heading, controls or spacing wrapper.

## Insert it inside the content

**A Page sections row is not required for an inline collection.**

- **Blog:** click between paragraphs in the **Content** editor.
- **Trip:** open the **Essential Information** or **Hotels Near Destination** panel, add/edit an entry, and click inside its **Content** editor. The collection stays inside that entry's accordion.
- Trip **Overview**, **Why Choose This Trek**, **Route map and altitude chart content**, and **Additional departure notes** also have the same block menu.

Use the editor's toolbar **block menu → Multi-URL Preview**, or type **`/multiUrlPreview`**. Fill in the same heading, layout, animation and URL rows in the inserted block. Continue writing below it. You can have multiple collections in the same body, with text, lists and tables between them. The existing single **Link preview** block remains available.

Inline collections use a subordinate heading and scoped styles so article list indentation, heading margins, drop caps and underlined text links do not leak into the cards. Inline content is saved in Lexical JSON and participates in the document's existing localization, drafts and version history.

## Layouts

| Admin choice                          | Frontend behavior                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Original link cards — stacked**     | The existing horizontal Link preview card treatment, in a tidy vertical list. No slider controls. Cards adapt to narrow columns.                                                                 |
| **Card slider — swipe through cards** | Portrait cards with a consistent image ratio. One card with a next-card hint on small screens, two in medium columns, three in wide columns. Swipe, use the scrollbar, or use the arrow buttons. |
| **Carousel — one link at a time**     | One original-style card per snap position, with previous/next controls and a position indicator. No autoplay or cloned links.                                                                    |

The breakpoint follows **the collection's actual container width**, not just the browser: a narrow desktop accordion behaves like a narrow column. Slider columns change at `34rem` and `58rem`. There are no fixed card heights; cards in the same rail align naturally. One-link collections simplify to one original card without redundant controls. Controls disappear when all links already fit.

## Animations

Five distinct, restrained presets are available:

| Preset        | Effect                                            |
| ------------- | ------------------------------------------------- |
| **Fade**      | Gently appear.                                    |
| **Rise**      | Lift a short distance into place.                 |
| **Slide**     | Glide in horizontally.                            |
| **Soft zoom** | Settle from a slightly smaller scale.             |
| **Reveal**    | Uncover from left to right.                       |
| **None**      | No entrance, hover or animated scrolling effects. |

The preset animates cards as they enter view; a carousel also animates the incoming card after navigation or a settled swipe. **The visitor's reduced-motion preference overrides every preset**, including smooth scrolling and hover transforms. Changing that preference cancels any running effects. Server-rendered cards start readable: an unavailable animation API or disabled JavaScript cannot strand invisible content.

## Links and metadata

- Accepts public `http://` / `https://` URLs and root-relative site paths such as `/trips/annapurna-base-camp`.
- Rejects executable schemes, protocol-relative URLs, credentials, explicit private/loopback hosts and nonstandard ports. Blank draft rows are harmless.
- Uses the existing metadata parser, card and thumbnail fallback behavior. Own Trip/Blog/Destination pages use their actual CMS title, summary and featured image. External pages use the same Open Graph/Twitter/JSON-LD/HTML fallbacks as single Link preview.
- Each collection resolves up to four URLs concurrently, memoizes duplicate lookups while retaining separate overrides, and shares an eight-second render budget. Outstanding external fetches are aborted when the batch finishes or times out. A failed/blocked/slow source falls back to its host and the editor's supplied details rather than breaking the other cards.
- External metadata requests check the target and resolved addresses before each redirect, allow at most three redirect hops, and refuse redirects back to this site's canonical host or its `www` alias to avoid recursive page renders. Page reads are bounded and cached through the existing metadata fetcher. DNS checks are a preflight, not a pinned-address network sandbox.
- Internal links stay in the current tab; external links open a new tab with `noopener noreferrer`.

## Accessibility and responsive review

The collection is a labelled region containing an ordinary ordered list of real links. Slider/carousel controls have accessible names, associated track IDs, disabled endpoints, a polite position announcement, visible focus rings and 44px touch targets. Every link remains keyboard-accessible; no off-screen card is hidden from assistive technology.

- **Tab** to the list, links or previous/next buttons.
- With the list or a link focused, use **Left / Right**, **Home / End**. Arrowing from a link moves focus with the card. Normal Enter activation and modified browser shortcuts are not intercepted.
- On touch devices, swipe the native scrolling track. Vertical page scrolling remains native.
- Try reduced motion and **None**; cards should remain visible and controls should still work.

Implementation verification on 2026-11-19 used Chromium at **320, 375, 390, 768, 834, 1024, 1440 and 1920 CSS pixels**, with real card styles in full-width, article and accordion containers. Checks covered page overflow, aligned rail items, narrow desktop cards, heading/list style isolation, keyboard focus/endpoints, accordion close/reopen, all five real Web Animations effects, reduced-motion cancellation, None, and a native mobile touch swipe. This is a viewport/browser test matrix, not a claim of testing every physical device or browser.

## Deployment and data

Run **`npm run migrate`** against the intended database before serving the updated CMS. The project's normal build also runs pending migrations when a real database is configured. Regenerate the admin import map with `npm run generate:importmap` when installing outside the normal postinstall/build flow.

Migration **`20261119_170704_multi_url_preview`** adds the section kinds and optional collection settings, plus independent child tables for Trip, Blog and both version stores. The URLs inherit the parent page section's locale and sort order. Table/index names stay below PostgreSQL's identifier limit. Existing rows and content are not rewritten, and no empty Multi-URL Preview row is automatically inserted into an existing or default layout.

**Back up/export new collections before rolling this migration down.** Rollback deliberately removes Multi-URL Preview page-section rows and their new link tables before narrowing the enums. It preserves old sections, single Link preview data and HTML. Inline blocks remain in stored Lexical JSON but are not rendered by an older application that does not recognize the block.

The migration was rehearsed on an isolated PostgreSQL-compatible PGlite database after applying the entire existing migration chain: transactional upgrade, localized live/version writes, per-link order and overrides, collection-specific foreign keys, populated rollback and reapply. This does not apply anything to a production database.

## Code and automated checks

- Shared fields and editor block: `src/fields/multi-url-preview.ts`, `src/fields/content-editor.ts`.
- Validation, presets and normalization: `src/lib/multi-url-preview.ts`.
- Server batch resolution/transport: `src/lib/multi-url-preview-resolver.ts`, `src/lib/link-preview-public-fetch.ts`.
- Shared server/client rendering and container-query styles: `src/components/sections/multi-url-preview-*` and `multi-url-preview.css`.
- `npm test` includes field/layout/validation tests, resolver and transport tests, both real detail-view rendering paths, rich-text order and empty-state regressions, migration/snapshot checks, and jsdom interaction/StrictMode hydration/motion tests.
- `npm run typecheck` and `npm run build` check Payload/Next integration. No new runtime dependencies were added.

See also [page sections](page-sections.md) for existing Link preview and Custom HTML behavior.
