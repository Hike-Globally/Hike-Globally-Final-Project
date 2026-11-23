# Destination pages — titles, copy, related links and indexability

`/destinations/[slug]` renders every entry of the **Destinations** collection, which today means two
different kinds of page wearing one template:

| Kind | Entries | What it is |
| --- | --- | --- |
| **Region** | `far-western-nepal`, `mid-western-nepal`, `western-nepal`, `central-nepal`, `eastern-nepal` | One trail area: its own trips, its own copy, its own place in the site's topic structure. |
| **Continent** | `africa`, `asia`, `australia`, `europe`, `north-america`, `south-america` | A bucket for future country pages. Most currently hold **one trip and a general essay**. |

The distinction is not cosmetic: it drives the page's title, its "More …" rail and whether the URL
belongs in the index at all. `isContinentDestination()` in `src/lib/destination-groups.ts` is the
single source of truth — it reads the slug first because several continent entries were saved with
`country = "Nepal"`.

---

## 1. Titles: the fallback, and why an editor's title can lose

The keyword fallback is built per kind:

```ts
isContinentDestination(destination)
  ? `${destination.name} — trekking destinations & trails`
  : `${destination.name} — trekking region`
```

An editor's `meta.title` normally wins. It **loses**, though, when it says nothing the fallback does
not: `metaTitleOrFallback()` in `src/lib/seo.ts` treats a meta title as unset when it reduces to the
document's name alone, or the name plus the brand.

| Editor typed | Result |
| --- | --- |
| `Eastern Nepal` | fallback wins → `Eastern Nepal — trekking region` |
| `Eastern Nepal: Hike Globally` | fallback wins → `Eastern Nepal — trekking region` |
| `Kanchenjunga Base Camp Trek \| Eastern Nepal` | kept verbatim |
| `Eastern Nepal trekking guide` | kept verbatim |

The comparison is case-, punctuation- and whitespace-insensitive, so a re-typed title still counts as
the same (thin) title. This matters because the SEO panel is filled by hand, and retyping the
document's name is the single most common mistake — it silently deletes the one phrase the page could
rank for.

`seoFromDoc()` takes an optional `fallback.subject`; only the destinations route passes it, so trips,
posts and pages keep their existing behaviour.

---

## 2. Copy: one sentence must render once

`tagline` (the hero lead), `description` (the "About …" body) and `gettingThere` are three independent
CMS fields, and nothing in Payload stops the same sentence going into all three. The live Eastern Nepal
page did exactly that.

`destinationCopyVisibility()` in `src/lib/destination-copy.ts` decides what renders:

| Block | Renders when |
| --- | --- |
| Hero lead | it is not the same sentence as the About body |
| About body | it has any text at all |
| Getting there | it differs from **both** of the above |

The earliest copy wins, so the sentence survives in the About body and keeps its `<h2>`. A page with a
short tagline and a long essay is never affected — this only fires on the pathological case, and it
clears itself the moment the copy is rewritten.

---

## 3. "More trekking regions": never "everything that is not me"

The rail was `allDestinations.filter((item) => item.id !== destination.id).slice(0, 3)`. Listing order
is `-featured`, and the featured destinations are Nepal's five regions — so **Europe and Australia both
ended their pages with three Nepali regions** under a heading that called them "more trekking regions".

`relatedDestinations()` in `src/lib/related-destinations.ts` fixes it in two steps:

1. **Same kind only.** A continent recommends continents; a region recommends regions. The two answer
   different questions ("where in the world?" vs "which valley next?").
2. **Score by what they share.** Same country (`+8`), same CMS `region` bucket (`+4`), featured (`+1`).
   Ties keep the caller's order, which is still featured-first.

The heading follows the group: `More trekking destinations` on a continent page, `More trekking
regions` on a region page.

---

## 4. Indexability: a continent has to earn its entry

Nepal's five regions are indexed unconditionally — they are the site's topical hubs. A continent page
is the thinnest URL on the site until it has content of its own, so `src/lib/destination-indexing.ts`
applies one rule:

> **A continent is indexed when it has `CONTINENT_MIN_TRIPS` (2) published trips, or
> `CONTINENT_MIN_WORDS` (400) words of destination copy. Otherwise it is `noindex,follow`.**

How it clears itself: publish a second trip, or write real guide copy. No code change, no deploy.

The verdict is applied in **three places that must agree**, all from the same helper:

| Where | What it does |
| --- | --- |
| `generateMetadata` on the route | `<meta name="robots" content="noindex, follow">` |
| `sitemapDocument()` in `src/lib/sitemap-records.ts` | drops the URL from `/sitemap.xml` — and from `/llms.txt`, which reads the same documents |
| `readChartSources()` in `src/lib/data.ts` | drops the node from the HTML `/sitemap` chart |

`follow` is deliberate: a page that is out of the index still passes its links to the trips and regions
it points at, which is the whole point of keeping it crawlable.

The editor's `meta.noIndex` checkbox still wins over everything, and is the right tool when a page
should be out of the index for a reason the rule cannot see.

### What this means for the current content

| Continent | Trips | Copy | Verdict |
| --- | --- | --- | --- |
| Australia | 1 (Larapinta) | ~270 words | **noindex** — a general essay about the continent |
| Europe | 1 (Laugavegur) | ~200 words | **noindex** — thinner than Australia, same shape |

Both clear the rule the same way: a second published trip, or ~400 words that answer "where do I
trek in X?" rather than "what is X?".

---

## Tests

| File | Covers |
| --- | --- |
| `src/lib/seo.test.ts` | `metaTitleOrFallback()` and `seoFromDoc()` with a subject |
| `src/lib/destination-copy.test.ts` | the dedupe verdict, including re-typed repeats |
| `src/lib/destination-indexing.test.ts` | the rule, its thresholds, and the sitemap verdict |
| `src/lib/related-destinations.test.ts` | group separation, scoring, limits, heading |
| `src/lib/destination-detail-render.test.ts` | the rendered page: one sentence, the right heading, the ItemList |

Run everything with `npm test`.
