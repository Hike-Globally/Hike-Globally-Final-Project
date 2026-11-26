/**
 * News taxonomy — the "News categories" of the `news` collection.
 *
 * Two jobs:
 *   • a select field on every news article (stored as an array in the `categories` column), and
 *   • a `?category=` filter on `/news` — every option carries its own filtered archive URL so
 *     the filter list never has to be built at render time.
 *
 * The `category…` keys mirror the same-shaped dictionary block (`dict.news`), so each option's
 * display label comes from `dictionary` rather than being duplicated here.
 *
 * Shared by the `News` collection and `news-categories.test.ts` (which locks the shape).
 */

export type NewsCategoryOption = { label: string; value: string }

/**
 * The categories every news article is filed under. Ordered as the archive shows them.
 * Distinct from the blog's own taxonomy (`src/lib/blog-categories.ts`).
 */
export const newsCategoryOptions: NewsCategoryOption[] = [
  { label: 'World news', value: 'world-news' },
  { label: 'Travel', value: 'travel' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Culture', value: 'culture' },
  { label: 'Wildlife & nature', value: 'wildlife' },
  { label: 'Sustainability', value: 'sustainability' },
  { label: 'Industry', value: 'industry' },
]
