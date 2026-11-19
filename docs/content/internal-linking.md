# Automated internal keyword linking

Every phrase an editor nominates in a document's **Keyword For Internal Linking** panel becomes a
real link to that document wherever it appears in the site's rich text — without an editor having to
add the link by hand. It runs on blog posts, trip pages, destination pages and CMS pages.

Internal links are the one ranking lever that decays silently: nobody goes back to a 2023 article to
wire up a trip published in 2026, so the newest pages — the ones that most need authority — are the
least linked. This closes that gap, and it does it with a list an editor controls.

## For editors

**You choose the anchors.** Open a trip, post, destination or CMS page, fill in **Keyword For
Internal Linking**, and every occurrence of those phrases elsewhere on the site links back to it.
Publish a post that mentions "Annapurna Circuit Trek" and, if the trip's panel contains that phrase,
the mention links to `/trips/annapurna-circuit-trek` on its own.

Three things are worth knowing:

| Thing                                              | Detail                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The phrases come only from the **panel**           | Not from the SEO keywords, the title or the slug. Adding a phrase to a trip makes the whole site start linking to it by that phrase; an editor can nominate an anchor that has nothing to do with the page's search keywords. See [README → Internal linking](../../README.md#internal-linking). |
| An empty panel means **no links to that page**     | The list is the switch. There is no title/slug fallback, so a page nobody has filled in is simply not linked to. Clear the list to opt a page out.                                                                                                            |
| A link you add by hand always wins                 | If you have already linked a mention, the automation will not add a second link to the same page anywhere else in that document. Where you and the automation disagree, you win.                                                                              |

The automation never touches a heading, a bullet list, a quote, a table, an image caption or a link
that is already there. It only ever works inside running paragraphs.

If a link looks wrong, the fix is in the document being linked _to_, not in the page it appeared on:
change or remove the phrase in its **Keyword For Internal Linking** panel, or clear the whole list to
switch its links off.

## The rules

All of them exist because the opposite is a documented over-optimization pattern. They live in
`src/lib/internal-links.ts` and are pinned by `src/lib/internal-links.test.ts`.

| Rule                                                                  | Why                                                                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| The **longest** phrase wins at any position                           | "Everest Base Camp Trek" is a better anchor than "Everest".                                                                                 |
| The **first** mention only, once per phrase per page                  | Repeating one anchor text is the classic manipulation tell.                                                                                 |
| **One link per target** per page, including manual ones               | A second link to the same URL passes nothing extra.                                                                                         |
| Never a link to the **page itself**                                   | Self-links are noise.                                                                                                                       |
| At most **8 links per page** (`maxLinksPerPage`)                      | Past that the value per link drops and the copy reads as a link farm.                                                                       |
| At least **140 characters of copy between two links** (`minGapChars`) | Two anchors in one sentence is a cluster. The count includes headings and lists — copy the reader travels through but that is never linked. |
| On a tie, **trips and destinations outrank posts**                    | The money pages take the budget when it runs out (`COLLECTION_WEIGHT`).                                                                     |
| The anchor text is the copy **exactly as written**                    | Never rewritten to the target's title, and never case-folded.                                                                               |
| Only phrases an editor **nominated**                                  | Nothing is inferred from a title, a slug or an SEO keyword.                                                                                 |

A phrase shorter than two characters is ignored — a single letter would match almost every paragraph
on the site. Nothing else is filtered: a short acronym ("EBC") and a phrase built from generic words
("Best Treks in Nepal") are used if an editor typed them, because a human chose the anchor.

## How it works

```
Published docs ──► link index ──► InternalLinker ──► RichText renderer ──► <a href>
   (Postgres)     (Data Cache)      (per page)
        ▲                                                    │
        └──────────────── revalidateTag() ◄──────────────────┘
```

**Render time, not save time.** The alternative — a `beforeChange` hook writing Lexical `link` nodes
into `content` — is rejected deliberately: it mutates copy nobody typed, leaves dead links behind
when a slug changes, and can only be undone with a rewrite pass over every document. Linking in the
renderer means the CMS content stays exactly as written and switching the feature off is deleting one
`await` per route.

| Piece          | File                                                           | Role                                                                                                                                                         |
| -------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| The panel      | `src/fields/internal-link-keywords.ts`                         | The one place anchor phrases are written: a localized chip input, one line in each collection.                                                              |
| The engine     | `src/lib/internal-links.ts`                                    | Phrase normalization, index compilation, the matcher, the per-page budget, text splitting. Pure — no Next.js, no Payload, no environment.                   |
| The index read | `src/lib/data.ts` → `createInternalLinker()`                   | Four parallel queries for published trips, destinations, posts and pages, selecting `internalLinkKeywords`, cached under `['internal-link-targets']`.       |
| The renderer   | `src/components/content/rich-text.tsx`                         | Takes an optional `linker` prop: `collect()` before rendering, then each `text` node asks `planFor()` what it won.                                           |
| The routes     | `blog/[slug]`, `trips/[slug]`, `destinations/[slug]`, `[slug]` | Each awaits one `createInternalLinker({ collection, id })` and threads it down, so the page cannot link to itself.                                           |

### Why a prop and not React context

Context is the obvious shape for "one object shared by every rich text block on a page", and it is
the one that does not work here. This is a React Server Component tree: `createContext` is not
available to a server module at all — `next build` fails on the import, not at runtime — and even
with a client-component wrapper it would not help, because a provider component _returns_ before
React has rendered its children. There is no moment at which the value could be both set and read.

So the linker is threaded explicitly: `page.tsx` → the detail view → the sections → `<RichText>`.
That is eleven components that grew one optional prop, which is more files than a provider would
have touched, and it is worth it: the data flow is visible, `npm run typecheck` fails if a route
forgets it, and a `<RichText>` with no `linker` renders byte-for-byte as it did before the feature
existed.

### Why the linker collects before it renders

A trip page renders several rich text blocks. If each one linked as it rendered, the _first_ block
would spend the whole budget — and on a trip page the first block is the overview, so the itinerary
and departure notes would get nothing. So the renderer walks its tree first (`collect`), noting every
candidate text node and where it sits in the page's copy, and only then decides (`flush`). The budget
is per page, because the one linker instance is shared by every block the route passes it to, and a
node is decided exactly once.

### Invalidation is already solved

`src/hooks/revalidate.ts` purges the collection tags on every publish, rename and unpublish, and the
link index rides those same tags. Rename a trip's slug and every page that linked to it re-renders
with the new href on the next request — no cron, no rebuild, no stale links. `REVALIDATE_SECONDS` is
the safety net behind a missed webhook.

### Failure mode

`createInternalLinker()` goes through the same `safeQuery()` as every other read: with no database
configured, or on a query error, it returns an **empty** linker. An empty linker matches nothing, so
a build without Postgres and a page during a database blip both render exactly the HTML they rendered
before the feature existed. It degrades to "off", never to an error page.

## Known limitation

A phrase split across two Lexical text nodes is not matched. "the **Everest Base Camp** Trek" is
three nodes, because Lexical stores formatting as node boundaries; matching across them means
re-merging the tree before rendering and re-splitting it after. The skipped cases are exactly the
mentions an editor already emphasised, and therefore the ones they most likely linked by hand.

## Tuning

`INTERNAL_LINK_DEFAULTS` in `src/lib/internal-links.ts` holds the policy: `maxLinksPerPage`,
`minGapChars`, `minPhraseLength`, `maxPhrases`. They are constants rather than CMS fields on purpose —
this is an SEO decision, not an editorial one, and a per-document field means 400 documents with 400
different settings. Which phrases become links is the editorial decision, and that lives in the
panel. A single route can override the policy for one page by passing a second argument to
`createInternalLinker(self, overrides)`.

## Extending it

- **SEO keywords and linking phrases are deliberately separate.** `keywordsSection()` still feeds
  `<meta name="keywords">`, Open Graph tags and JSON-LD; it no longer feeds this index. A document
  can target one set of search terms and be linked by another.
- **The listing pages and the homepage are not wired.** They render cards rather than prose, so there
  is little to link; wrapping them would be the same one-line change if that ever changes.
- **An orphan-page report** falls out of the index for free: any target no page links to. That is
  usually a bigger win than the linking itself.

## Deployment

Migration **`20261119_180000_internal_link_keywords`** introduces the panel. It adds the shared
hasMany-string tables for Destinations and Pages (Trips and Blog already had one), and it copies
every existing SEO keyword list into `internalLinkKeywords` for the live trip/post and each saved
draft — so those auto-links do not disappear on deploy simply because nobody has opened the new panel
yet. **Destinations and Pages start empty**, because they never had a keyword list to copy; fill
their panels to start linking to them. Run `npm run migrate` before deploying the application, as
usual. There is no environment variable.

Turning the feature off for one page means clearing that page's panel. Turning it off everywhere
means dropping the `linker={linker}` argument from the four routes' `createInternalLinker()` calls —
or just deleting the calls; the engine, the prop and the tests can all stay without affecting a
single byte of output, because a `<RichText>` with no linker renders exactly what it rendered
before.

Verify it after a deploy the way a crawler would — with a plain GET, no JavaScript:

```bash
curl -sSL https://www.hikeglobally.com/blog/<some-post> | grep -o 'data-auto-link="true" href="[^"]*"' | sort | uniq -c
```

Expect at most eight rows, no row pointing at the page you fetched, and no two rows with the same
href.
