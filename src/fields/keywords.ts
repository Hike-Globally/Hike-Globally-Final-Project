import type { CollapsibleField, Field } from 'payload'

/**
 * Hard ceiling on the keyword list.
 *
 * `<meta name="keywords">` is a hint, not a ranking signal: Google has ignored it for years, and
 * a 200-word list actively hurts (it dilutes the terms that matter and looks like keyword
 * stuffing to the engines that do read it). The cap keeps the field honest — a shortlist of what
 * the page is genuinely trying to rank for, not a dump of a keyword tool.
 */
export const MAX_KEYWORDS = 20

/** Longest single keyword. Anything longer is a sentence, and belongs in the copy. */
export const MAX_KEYWORD_LENGTH = 80

/**
 * The "Keywords" section of a document — the list of terms the page is targeting.
 *
 * A collapsible panel (the same shape as every other optional section in these collections) with
 * one `text` field set to `hasMany`, which Payload renders as a chip input: type a phrase, press
 * Enter, repeat. That is the closest admin UI to "a list of keywords" there is — no row
 * scaffolding per word, and reordering is a drag.
 *
 * The field is `localized: true` like the rest of the SEO data, so a keyword list belongs to a
 * language, and it lands in the collection's existing `_locales` table.
 *
 * Where the values go: `src/lib/seo.ts` normalizes them (`normalizeKeywords()`) and emits them as
 * `<meta name="keywords">`, as `article:tag` Open Graph tags on posts, and as `keywords` in the
 * page's JSON-LD.
 */
export const keywordsSection = (
  overrides: Partial<Omit<CollapsibleField, 'type' | 'fields'>> = {},
): Field => ({
  type: 'collapsible',
  label: 'Keywords',
  fields: [
    {
      name: 'keywords',
      type: 'text',
      hasMany: true,
      localized: true,
      label: 'Target keywords',
      maxLength: MAX_KEYWORD_LENGTH,
      maxRows: MAX_KEYWORDS,
      admin: {
        placeholder: 'everest base camp trek',
        description:
          `The phrases you want this page to rank for. Type one, press Enter, repeat — up to ${MAX_KEYWORDS}. ` +
          'Write them the way a traveller would search ("everest base camp trek cost"), lead with ' +
          'the most important, and use the same wording in the title and copy. They are published ' +
          'as meta keywords, as Open Graph article tags and in the structured data.',
      },
    },
  ],
  ...overrides,
})
