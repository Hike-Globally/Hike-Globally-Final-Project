# Trip and blog page sections

Open a trip or blog post in the Payload admin and use **Page sections** near the top of the form.

- Drag a row by its handle to change the order on that individual page. The row menu also provides Move Up / Move Down controls.
- Choose **Add Page section**, leave **Section** set to **Custom HTML**, and paste your code — HTML, CSS and JavaScript all work (see [Custom HTML, CSS and JavaScript](#custom-html-css-and-javascript)). A visible section heading is optional. Drag this row anywhere in the list; multiple HTML rows are supported.
- Existing rows refer to the existing content editors below the panel. For example, edit the Overview field to change the Overview row's content. Essential Information entries and Hotels Near Destination hotel entries are managed in their correspondingly named panels; the Page sections rows control whether each section is displayed.
- Removing an existing section row hides it without deleting its source content. Add that section again to restore it. A built-in section other than **Custom HTML**, **Link preview** and **Multi-URL Preview** may only appear once, because it renders the document itself — a second copy would repeat the same content. Those three carry their own content per row, so a page can hold several independent instances, and at least one row must remain.
- Save a draft or use live preview to review the order, then publish to update the public page. The order and custom HTML are included in version history.

The trip booking sidebar remains alongside body content, and the blog table of contents remains alongside the article body. Hero, inquiry/planning, and related-content bands keep their full-width layouts when moved. The shared site header and footer are not part of these per-page layouts. The sidebar's **Download Trip Brochure** button is not a section either — it belongs to the trip document itself (see `docs/content/trip-brochure.md`).

## Who is this trip for / not for

The trip frontend (including draft preview) normalizes enabled sections into this flow:
**Key Takeaways → Trip Overview → Key Highlights → Why Choose This Trek → Who Is This Trip For →
Who Is This Trip Not For → Itinerary → Essential Info → Hotels Near Destination →
Inclusion/Exclusion → Live Map and Altitude Charts → Packing List → Departures → FAQs → Gallery**.
Related Trips closes the page after any inquiry band. Custom HTML and link-preview rows retain
their relative saved order after Gallery and before the closing bands. Removing a row still hides
that section; normalization does not add missing rows or alter their content. Blog layouts retain
their document-specific ordering.

Trips have a single **Who is this trip for / not for** row after **Why Choose This Trek** in this
frontend flow. It renders the For card before the Not For card, using the content edited in the
**Who Is This Trip For** and **Who Is This Trip Not For** panels. Migration
`20261107_120000_trip_audience` adds this row after Highlights in every trip layout that was already
saved. See `docs/content/trip-audience.md`.

## Blog FAQs

Blog posts have the same **FAQs** panel as trips, directly below the post body, with the same seven categories (General Questions, Best Time To Trek, Required Permits For The Trek, and so on). Each filled-in category is shown under its heading in a **Frequently Asked Questions** section that looks exactly like the one on trip pages; empty categories are hidden, and the questions are also published as `FAQPage` structured data — still parsed by Google for AI Overviews and LLM answers, even though FAQ rich results were removed in May 2026 (see the README's "Open Graph and structured data" section).

The section's position comes from the **FAQs** row in Page sections, which sits right after **Article body & table of contents** by default. Posts without questions show nothing, so the row can stay in place until FAQs are added.

## Link preview

Trips and blog posts both have a **Link preview** row in Page sections. Choose **Link preview** in a row's **Section** select and a **URL** box appears in that row; the row shows a card for that page, wherever it sits in the layout. With no URL the row renders nothing.

The URL and the card's details live in the row, not in a panel elsewhere on the form, so the card is edited in the one place it is placed. Being part of the (per-language) Page sections array, it is ordered, versioned and translated with the rest of the layout like any other section.

A page can have **as many Link preview rows as it needs** — a trip often points at the operator, a partner's booking page and a related guide. Each row keeps its own URL, title, description and prices, so the cards are different cards and can sit at different places in the layout. Row labels in the admin show the address a row points at (`3. Link preview — booking.com`, `7. Link preview — /blog/altitude`) so repeated rows stay tellable apart, and a row with no URL renders nothing, which is also how an empty row stays invisible until it is filled in.

- **URL** — the only field that matters — can be a full `https://` address to any page, or a path on this site such as `/trips/annapurna-base-camp`. Pages on other sites open in a new tab; this site's own pages open in the same tab.
- **A link to a page on this site** — a trip, a post or a destination — is answered from the CMS instead of the network, so the card shows **that document's own featured image**: a trip's hero image, a post's featured image, a destination's hero image (with the SEO group's sharing image as the fallback when a document has no featured image). The title and one-line summary come from the same document. Nothing is fetched, so the card cannot end up on the site icon because our own page was slow or not deployed yet, and a render makes no request to itself.
- **Image, title and description for every other page** are read from the page itself, whichever way that page declares them — so another site's page looks the same in the card as one of ours:

  |             | read in this order                                                                                                                                                 |
  | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | title       | `og:title` → `twitter:title` → JSON-LD `headline`/`name` → `<title>` → `og:site_name`                                                                              |
  | description | `og:description` → `twitter:description` → `<meta name="description">` → JSON-LD                                                                                   |
  | image       | `og:image` (and `:url` / `:secure_url`) → `twitter:image` → `<link rel="image_src">` → JSON-LD `image` → `apple-touch-icon` → the first usable `<img>` on the page |

  The request is made as a current desktop Chrome would make it, because many hosts answer a bot-looking client with a 403 or an empty page, and it gives up after eight seconds; the result is cached for an hour, like the page that shows it. Relative and protocol-relative image addresses are resolved against the linked page. The **title and description can be overridden** in the row; the image is always the linked page's.

  **The card always shows a picture, and it never asks the other site for it directly.** A browser `<img>` pointed at somebody else's server is what used to leave cards blank: hosts with hotlink protection, a `Referer` they dislike or a CDN that only answers its own pages refuse that request, and the card then shows a broken-image glyph. Instead every picture loads through `/api/link-preview-image?url=…` (`src/app/api/link-preview-image/route.ts`), so the browser only ever talks to this site and the bytes are cached at the edge under our own `Cache-Control`. The thumbnail then tries, in order: the page's own image (filled, `object-fit: cover`), then `https://<host>/apple-touch-icon.png`, then `https://<host>/favicon.ico` (both contained in a padded square), which is what makes an image render for a page that declares none at all — a blocked bot, a JavaScript-only app, a plain document. The site's initial is the last resort, only when every candidate has failed to load, so the card still reads as finished rather than empty or broken.

  The proxy is public, so it is also kept narrow: only `http`/`https`, no credentials in the URL, ports 80/443 only, a public host (the resolved address is checked too, so a public name cannot point at a private network), manual redirects where each hop is re-checked, at most 3 of them, 8 seconds for the whole chain, a 4 MiB cap on the body, and a raster-only content-type whitelist (SVG is refused because it can carry script and would then run on this origin).

- **Price and original price** are typed in, since they are not part of a page's metadata. The original price is shown struck through before the price.
- The card deliberately has **no badges or ribbons** (no “Best seller”, no “Save US$ …”, no “Group discount” pill). It is the same card on trips and blog posts, and is styled in `src/components/sections/link-preview.css`.

The row can be dragged like any other section, and it is part of version history. Migration `20261115_180000_link_preview` adds the row to every saved layout (after **Who is this trip for / not for** on trips, when present, and directly after the article body on posts). It does not change anything on a page until a URL is entered. Migration `20261115_200000_link_preview_in_page_section` then moves the URL and the card's details from the old document panel into that row (copying any card already filled in, then dropping the panel's columns) — see [Deployment](#deployment).

Implementation: `src/lib/link-preview.ts` (URL validation, metadata parsing, merge rules), `src/lib/link-preview-internal.ts` (the CMS lookup behind a card for one of our own pages), `src/lib/link-preview-image.ts` (the proxy's URL/candidate/SSRF rules), `src/app/api/link-preview-image/route.ts` (the image proxy itself), `src/fields/link-preview.ts` (the row's fields, spread into the row by `src/fields/page-sections.ts`), `src/components/sections/link-preview-section.tsx` (reads the row it is rendered from), `src/components/sections/link-preview-card.tsx` (the card's markup), `src/components/sections/link-preview-thumb.tsx` (thumbnail and fallback tile) and `src/components/sections/link-preview.css` (the styling).

## Multi-URL Preview

Choose **Section → Multi-URL Preview** to add up to **12 independently configured URLs** in one collection. It offers **original stacked link cards**, a **card slider**, or a **one-card carousel**, plus **Fade, Rise, Slide, Soft zoom, Reveal** and **None**. Optional metadata overrides, ratings and prices work per URL, using the existing Link preview card behavior. Empty collections render nothing; existing single Link preview cards remain unchanged.

It is also available **inside content**, not only as a Page sections row: in a Blog body, the Trip **Essential Information → Content** editor, or the **Hotels Near Destination → Content** editor, choose **Multi-URL Preview** from the block menu (or type `/multiUrlPreview`) between paragraphs. The collection stays in that body or accordion. See the [Multi-URL Preview editor and deployment guide](multi-url-preview.md) for all placements, responsive layouts, keyboard/touch controls, reduced motion and migration `20261119_170704_multi_url_preview`.

## Boxed Content

**Boxed Content** is the editorial image-and-copy plate from the shared rich-text editor: an
image on the left at desktop sizes, a heading and a short description on the right, stacked on
mobile. It is a Lexical block, not a Page sections row, so it lives wherever the content is
written and travels with that content in version history.

**Where it is offered.** Every rich-text field in the dashboard carries it, because they all run
on one editor definition (`contentEditor()` in `src/fields/content-editor.ts`, which is also the
root editor in `payload.config.ts`). That covers the Single Trip dashboard — **Overview**,
**Essential Information → Content** (every Content Section row), **Hotels Near Destination →
Content**, **Why Choose This Trek**, **Route map and altitude chart content**, **Additional
departure notes**, and both **Who Is This Trip For / Not For** descriptions — plus the Single Blog
dashboard's **post body**, the destination **description** and **getting there** copy, and the
Pages builder's **Rich text** block.

Two things worth knowing, because they are what made the block appear to vanish:

- Each rich-text field used to be able to name a _different_ editor. A field that named none fell
  back to the root editor, which was a reduced copy with no block menu at all — so the block
  silently disappeared from those fields with no error anywhere. The root editor and the shared
  editor are now the same definition, so there is no reduced fallback left to fall into, and a new
  rich-text field gets the block automatically.
- Content Section, Hotel, Itinerary and departure rows are added by a custom instant-array
  component (`src/components/admin/instant-trip-array.tsx`). A row added on the page builds its
  editor from the same shared editor, so the **first, newly added** Content Section has the block
  menu too — not just rows that came back from the server after a save.

**How to insert it.** Place the cursor between two paragraphs and either:

- choose **Boxed Content** from the toolbar's **blocks** dropdown (the row of square icons at the
  right of the toolbar — it lists Link preview, Multi-URL Preview and Boxed Content), or
- type `/boxed` in the body and pick **Boxed Content** from the slash menu.

It needs a **Heading** (120 characters), a **Description** (900 characters) and an **Image**
chosen from the media library; the image's alt text is what screen readers announce. The block
renders nothing at all until the heading or description has text, so a half-filled draft never
leaves an empty image well on the public page. Its heading joins the article's table of contents
and reading time like any other subheading, and the description is included in the post's
plain-text SEO copy.

No migration is involved: the block is stored in the existing rich-text JSON.

## Custom HTML, CSS and JavaScript

A Custom HTML row publishes **exactly what the editor pasted** — nothing is filtered or rewritten on
public pages or in previews. `<script>` tags, `<style>` blocks, `<link>` stylesheets, iframes,
`<object>`/`<embed>`, forms, event handlers (`onclick`, `onerror`, …) and any URL scheme are kept
verbatim, so whole third-party snippets work: the Travelpayouts affiliate loader at the repo root,
booking and search widgets, map embeds, an AdSense unit, a JSON-LD block.

Two implementation details worth knowing when a snippet misbehaves:

- **Scripts run exactly once, whichever way the page arrives.** A `<script>` in the HTML the server
  sends runs while the browser parses the page, so a hard load needs no help. Markup React inserts
  on the client — an in-app navigation, a live-preview update — is different: browsers parse
  `innerHTML` but never execute its scripts, so the client component `CustomHtml` calls
  `activateScripts()` (`src/lib/custom-html.ts`) and re-inserts each one as a live element, cloned
  attribute-for-attribute (loader flags such as `data-cfasync`, `data-no-defer`, `nowprocket` and
  `id` survive) and swapped into its original position, so `document.currentScript` still points at
  the right place. Scripts the parser already ran are marked `data-hg-script`, so no snippet can
  execute twice — which would otherwise double-render a widget and double-fire its tracking.
- **Order is preserved, and external files are awaited.** Each `<script src>` finishes loading
  before the next one is inserted, so a loader can be followed by the call that configures it
  (`<script src="widget.js"></script><script>Widget.init('#host')</script>`). Inline classic scripts
  run synchronously at insertion. A `type` that is not JavaScript (`application/ld+json`,
  `application/json`, `text/plain`, `importmap`, …) is published to the page but never executed.

Caveats: `document.write()` will replace the whole page once it has loaded — build DOM nodes instead.
Scripts run once per page view; a third-party snippet that appends elements to `<body>` cannot be
undone when a preview re-renders, so review widgets in the standalone live preview before publishing.

**Trust is the only control.** Editors with the `admin` or `editor` role can write trips and blog
posts (`src/access/index.ts` → `adminOrEditor`), and any code they paste runs for every visitor with
this site's full rights — reading cookies and `localStorage`, calling your APIs, changing the page.
That is the same model as a WordPress Custom HTML block. Keep those roles to people who should be
able to publish JavaScript to the storefront, and review unfamiliar snippets before saving. The
optional **Section heading** is the one part of a row rendered as escaped text, never as markup.

## Deployment

No migration is needed for the Custom HTML code support above: the section's `html` column already
stores the pasted string, and the change is entirely in how it is rendered (`src/lib/custom-html.ts`,
`src/components/content/custom-html.tsx`, `src/components/content/custom-html-section.tsx`) plus the
regenerated `src/payload-types.ts` descriptions. Deploy the app as usual; existing rows keep their
saved markup, and any `<script>` that was previously stripped on the way out now runs.

Run `npm run migrate` before deploying the updated application. Migration `20261014_142919_page_sections` adds localized ordered rows for both collections and their version tables; it does not replace or delete existing content. Existing documents without a layout retain their original section order and show those defaults in the editor. New documents start with the same default rows.

Migration `20261115_180000_link_preview` adds the Link preview fields and enum values, and the **Link preview** row to saved layouts (see the Link preview section above). Nothing changes on a public page until a URL is entered.

Migration `20261115_200000_link_preview_in_page_section` historically moved the card's **URL, title, description, rating, review count and prices from the document into the Link preview row**, so the row an editor adds has a URL box in it instead of only a Section select. Every value already typed into the old panel is copied into the `linkPreview` row of each locale, live and versioned, and only then are the old document columns dropped — no published card changes on deploy. Run `npm run migrate` before deploying the updated application, as usual.

Migration `20261019_045205_blog_faqs` adds the blog FAQ fields and a **FAQs** row to every blog layout that was already saved — right after the article body (or at the end if that row was removed), in the live post and its version history. Nothing changes on screen until a post has questions.

The admin import map is generated by the project's existing postinstall command; regenerate it with `npm run generate:importmap` if needed.

## Reviews and ratings are not supported

There is no Testimonials block, star-rating field, review count, or review structured data.
Link preview and Multi-URL Preview cards retain their URLs, imagery, text, and prices only,
including cards embedded in rich text. Trip difficulty levels are unrelated and remain unchanged.

Migration `20261120_185728_remove_reviews` deletes saved testimonial blocks, card rating/review-count
columns, and the old **Average rating** statistic from live pages and version history. It also
removes the retired card fields recursively from rich-text JSON (including inline Multi-URL cards)
without changing the other card fields or paragraph order. Historical migrations remain intact.

**Back up the database before deploying.** This is intentional data deletion. `down` restores the
SQL schema only; it cannot recover deleted testimonials, ratings, or statistics. Run
`npm run migrate` before the updated app starts (the standard build already does this).
Preview deployments also run build-time migrations when a database is configured, so use an isolated
preview database rather than sharing production. Invalidate any externally cached pages after deployment.

## Verification

- `npm test` covers the link card as well: URL validation, the metadata order (Open Graph, Twitter, `image_src`, JSON-LD, touch icon, body image), protocol-relative and relative images, unusable addresses, a blocked host, an API endpoint, a network error, a non-UTF-8 charset, chrome-like request headers, and the render rules (editor overrides, host fallback).
- `npm test` covers the CMS lookup for our own pages (which addresses are ours, and that a trip/post/destination contributes its own featured image, with the editor's sharing image taking precedence), the image proxy (private and metadata hosts, credentials, exotic ports, self-referential targets, the raster-only whitelist, and the candidate order that guarantees a picture), the card's markup (an image is always present and always proxied, the price block sits in the card's row rather than at its foot, price rendering and absence of ratings/review counts, external vs internal links), legacy defaults, saved ordering, full-width grouping, the repeat rules for Custom HTML and Link preview rows (and the single-row rule for every other section), localized field-hook behavior, and Custom HTML publishing — scripts, styles, embeds, forms and event handlers survive to the rendered markup, the heading stays escaped, empty rows render nothing, and only JavaScript `type`s are runnable.
- `src/lib/custom-html.dom.test.ts` runs the real component in jsdom (the repo's only test-only dependency) and counts executions across every delivery path: a hard load, hydration, client-side navigation, an edit in live preview, a re-render of identical markup, and a StrictMode double mount. Each must run a pasted snippet exactly once — and an external `<script src>` must finish loading before the snippet pasted after it runs.
- `npm run typecheck`, `npm run lint`, and `npm run build` check integration with Payload and Next.js.
