# Trip and blog page sections

Open a trip or blog post in the Payload admin and use **Page sections** near the top of the form.

- Drag a row by its handle to change the order on that individual page. The row menu also provides Move Up / Move Down controls.
- Choose **Add Page section**, leave **Section** set to **Custom HTML**, and paste your code — HTML, CSS and JavaScript all work (see [Custom HTML, CSS and JavaScript](#custom-html-css-and-javascript)). A visible section heading is optional. Drag this row anywhere in the list; multiple HTML rows are supported.
- Existing rows refer to the existing content editors below the panel. For example, edit the Overview field to change the Overview row's content. Essential information entries can also be dragged within their existing content-sections array.
- Removing an existing section row hides it without deleting its source content. Add that section again to restore it. A built-in section may only appear once, and at least one row must remain.
- Save a draft or use live preview to review the order, then publish to update the public page. The order and custom HTML are included in version history.

The trip booking sidebar remains alongside body content, and the blog table of contents remains alongside the article body. Hero, inquiry/planning, and related-content bands keep their full-width layouts when moved. The shared site header and footer are not part of these per-page layouts. The sidebar's **Download Trip Brochure** button is not a section either — it belongs to the trip document itself (see `docs/trip-brochure.md`).

## Who is this trip for / not for

Trips have a **Who is this trip for / not for** row directly after **Highlights**. It renders the two
audience cards edited in the **Who Is This Trip For** and **Who Is This Trip Not For** panels. Migration
`20261107_120000_trip_audience` adds this row after Highlights in every trip layout that was already
saved. See `docs/trip-audience.md`.

## Blog FAQs

Blog posts have the same **FAQs** panel as trips, directly below the post body, with the same seven categories (General Questions, Best Time To Trek, Required Permits For The Trek, and so on). Each filled-in category is shown under its heading in a **Frequently Asked Questions** section that looks exactly like the one on trip pages; empty categories are hidden, and the questions are also published as `FAQPage` structured data.

The section's position comes from the **FAQs** row in Page sections, which sits right after **Article body & table of contents** by default. Posts without questions show nothing, so the row can stay in place until FAQs are added.

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

Migration `20261019_045205_blog_faqs` adds the blog FAQ fields and a **FAQs** row to every blog layout that was already saved — right after the article body (or at the end if that row was removed), in the live post and its version history. Nothing changes on screen until a post has questions.

The admin import map is generated by the project's existing postinstall command; regenerate it with `npm run generate:importmap` if needed.

## Verification

- `npm test` covers legacy defaults, saved ordering, full-width grouping, duplicate validation, localized field-hook behavior, and Custom HTML publishing — scripts, styles, embeds, forms and event handlers survive to the rendered markup, the heading stays escaped, empty rows render nothing, and only JavaScript `type`s are runnable.
- `src/lib/custom-html.dom.test.ts` runs the real component in jsdom (the repo's only test-only dependency) and counts executions across every delivery path: a hard load, hydration, client-side navigation, an edit in live preview, a re-render of identical markup, and a StrictMode double mount. Each must run a pasted snippet exactly once — and an external `<script src>` must finish loading before the snippet pasted after it runs.
- `npm run typecheck`, `npm run lint`, and `npm run build` check integration with Payload and Next.js.
