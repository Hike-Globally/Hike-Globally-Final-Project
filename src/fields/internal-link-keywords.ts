import type { CollapsibleField, Field } from 'payload'

import { MAX_KEYWORD_LENGTH } from './keywords'

/**
 * Hard ceiling on the internal-linking phrase list — the same ceiling as the SEO Keywords panel,
 * because both are chip inputs on the same document and a different limit would only confuse.
 *
 * The lists do different jobs, though: this one is not "what the page is about", it is the short
 * list of phrases an editor has decided should physically become an `<a href>` whenever they
 * appear in somebody else's copy. The per-page budget in `src/lib/internal-links.ts` keeps a long
 * list from turning every page that mentions the topic into a wall of links.
 */
export const MAX_INTERNAL_LINK_KEYWORDS = 20

/**
 * The "Keyword For Internal Linking" section of a document.
 *
 * This is the **only** source of the phrases that link to the document. Before it existed the
 * linker inferred phrases from the SEO `keywords` list, the title and the slug; that inference is
 * gone (see `src/lib/internal-links.ts`). Now an editor names the anchors explicitly, which is the
 * point: a page can target "everest base camp trek cost" in search while choosing to be linked by
 * "Everest Base Camp" in prose — or choose not to be linked at all.
 *
 * Same shape as the SEO Keywords panel — a collapsible section with one `text` field set to
 * `hasMany`, which Payload renders as a chip input — and `localized`, so a phrase list belongs to a
 * language like the rest of the content.
 *
 * An empty list is meaningful: it switches automated linking *to* this document off. That is why
 * the description says so, and why the migration that introduced the field copied each trip's and
 * post's existing SEO keywords into it — those pages do not go dark on deploy just because nobody
 * has visited the panel yet. Destinations and Pages had no keyword list to copy, so they start
 * empty and an editor fills them in.
 */
export const internalLinkKeywordsSection = (
  overrides: Partial<Omit<CollapsibleField, 'type' | 'fields'>> = {},
): Field => ({
  type: 'collapsible',
  label: 'Keyword For Internal Linking',
  fields: [
    {
      name: 'internalLinkKeywords',
      type: 'text',
      hasMany: true,
      localized: true,
      label: 'Phrases that link to this page',
      maxLength: MAX_KEYWORD_LENGTH,
      maxRows: MAX_INTERNAL_LINK_KEYWORDS,
      admin: {
        placeholder: 'everest base camp trek',
        description:
          `The phrases that should become a link to this page wherever they appear in another page's copy. Type one, press Enter, repeat — up to ${MAX_INTERNAL_LINK_KEYWORDS}. ` +
          'These are the only phrases used: the SEO keywords, the title and the slug are not linked automatically. ' +
          'Matching is exact (case-insensitive), so write the phrase the way it appears in the copy. ' +
          'Leave this empty to stop this page being linked to.',
      },
    },
  ],
  ...overrides,
})
