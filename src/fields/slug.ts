import type { FieldHook, TextField } from 'payload'

/**
 * Turns a human title into a URL-safe slug.
 *
 * Diacritics are transliterated so German/French titles produce clean URLs:
 *   "Zermatt & surroundings" -> "zermatt-surroundings"
 *   "Circuit du Mont-Blanc"   -> "circuit-du-mont-blanc"
 */
export const formatSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics (é -> e)
    .replace(/ß/g, 'ss')
    .replace(/[’'"“”]/g, '') // drop apostrophes/quotes
    .replace(/[^a-zA-Z0-9]+/g, '-') // everything non-alphanumeric becomes a separator
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .replace(/-{2,}/g, '-')
    .toLowerCase()

type HookArgs = Parameters<FieldHook>[0]

/**
 * Auto-fills the slug from `fallbackField` on create, and — while the document has never been
 * published — keeps it in sync when the title changes. Once an editor edits the slug by hand
 * (or the doc is live) the slug stabilises so live URLs never break silently.
 */
export const formatSlugHook =
  (fallbackField: string): FieldHook =>
  ({ data, operation, originalDoc, value }: HookArgs) => {
    if (typeof value === 'string' && value.length > 0) return formatSlug(value)

    const isCreate = operation === 'create'

    if (isCreate || !originalDoc?.slug) {
      const source =
        (data?.[fallbackField] as string | undefined) ??
        (originalDoc?.[fallbackField] as string | undefined)

      if (typeof source === 'string' && source.length > 0) return formatSlug(source)
    }

    return value
  }

type SlugOverrides = Partial<
  Omit<TextField, 'name' | 'type' | 'hooks' | 'hasMany' | 'maxRows' | 'minRows' | 'validate'>
>

/**
 * Localized slug field.
 *
 * `localized: true` is the key detail: each language gets its own slug, so the German version
 * of a trip lives at /de/trips/<german-slug> while English stays at /en/trips/<english-slug>.
 */
export const slugField = (fallbackField = 'title', overrides: SlugOverrides = {}): TextField => ({
  name: 'slug',
  type: 'text',
  label: 'Slug (URL)',
  localized: true,
  index: true,
  admin: {
    position: 'sidebar',
    description:
      'Auto-generated from the title. Each language has its own slug — edit carefully, changing it changes the live URL.',
  },
  hooks: {
    beforeValidate: [formatSlugHook(fallbackField)],
  },
  ...overrides,
})
